import json
import os
import logging
from datetime import datetime
from app.config import DATABASE_URL, DB_PATH

logger = logging.getLogger(__name__)

USE_POSTGRES = bool(DATABASE_URL and DATABASE_URL.startswith("postgresql"))

if USE_POSTGRES:
    try:
        import psycopg2
        import psycopg2.extras
        logger.info(f"Using PostgreSQL database at {DATABASE_URL}")
    except ImportError:
        logger.warning("psycopg2 not installed. Falling back to SQLite.")
        USE_POSTGRES = False

def get_db_connection():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if USE_POSTGRES:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id VARCHAR PRIMARY KEY,
            target VARCHAR NOT NULL,
            status VARCHAR NOT NULL,
            error_message TEXT,
            created_at VARCHAR NOT NULL,
            updated_at VARCHAR NOT NULL
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id VARCHAR PRIMARY KEY,
            job_id VARCHAR NOT NULL,
            title VARCHAR NOT NULL,
            category VARCHAR NOT NULL,
            date VARCHAR NOT NULL,
            time VARCHAR,
            venue VARCHAR NOT NULL,
            area VARCHAR,
            price VARCHAR,
            description TEXT,
            sources TEXT NOT NULL,
            scraped_at VARCHAR NOT NULL
        );
        """)
        
        cursor.execute("DROP TABLE IF EXISTS metrics_history;")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics_history (
            timestamp VARCHAR PRIMARY KEY,
            total_events INTEGER NOT NULL,
            unique_venues INTEGER NOT NULL
        );
        """)
    else:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            target TEXT NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            venue TEXT NOT NULL,
            area TEXT,
            price TEXT,
            description TEXT,
            sources TEXT NOT NULL,
            scraped_at TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs (id)
        )
        """)
        
        cursor.execute("DROP TABLE IF EXISTS metrics_history")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS metrics_history (
            timestamp TEXT PRIMARY KEY,
            total_events INTEGER NOT NULL,
            unique_venues INTEGER NOT NULL
        )
        """)
        
    conn.commit()
    conn.close()

def create_job(job_id: str, target: str) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    query = "INSERT INTO jobs (id, target, status, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)" if USE_POSTGRES else "INSERT INTO jobs (id, target, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    cursor.execute(query, (job_id, target, "PENDING", now, now))
    conn.commit()
    conn.close()

def update_job_status(job_id: str, status: str, error_message: str = None) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    query = "UPDATE jobs SET status = %s, error_message = %s, updated_at = %s WHERE id = %s" if USE_POSTGRES else "UPDATE jobs SET status = ?, error_message = ?, updated_at = ? WHERE id = ?"
    cursor.execute(query, (status, error_message, now, job_id))
    conn.commit()
    conn.close()

def save_merged_events(job_id: str, events: list) -> None:
    existing_events = get_all_events()
    all_events = existing_events + events
    from app.processor.deduplicator import deduplicate_events
    deduped_events, _ = deduplicate_events(all_events)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events;")
    
    insert_query = """
        INSERT INTO events (
            event_id, job_id, title, category, date, time, venue, area, price, description, sources, scraped_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """ if USE_POSTGRES else """
        INSERT OR REPLACE INTO events (
            event_id, job_id, title, category, date, time, venue, area, price, description, sources, scraped_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    for event in deduped_events:
        sources_json = json.dumps(event.get("sources", []))
        cursor.execute(
            insert_query,
            (
                event.get("event_id"),
                job_id,
                event.get("title"),
                event.get("category"),
                event.get("date"),
                event.get("time", ""),
                event.get("venue"),
                event.get("area", ""),
                event.get("price", "Free"),
                event.get("description", ""),
                sources_json,
                event.get("scraped_at", datetime.utcnow().isoformat() + "Z")
            )
        )
    conn.commit()
    conn.close()

def persist_snapshot(total_events: int, unique_venues: int) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    if USE_POSTGRES:
        cursor.execute(
            "INSERT INTO metrics_history (timestamp, total_events, unique_venues) VALUES (%s, %s, %s) ON CONFLICT (timestamp) DO UPDATE SET total_events = EXCLUDED.total_events, unique_venues = EXCLUDED.unique_venues;",
            (now, total_events, unique_venues)
        )
    else:
        cursor.execute(
            "INSERT OR REPLACE INTO metrics_history (timestamp, total_events, unique_venues) VALUES (?, ?, ?)",
            (now, total_events, unique_venues)
        )
    conn.commit()
    conn.close()

def get_job(job_id: str) -> dict:
    conn = get_db_connection()
    if USE_POSTGRES:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM jobs WHERE id = %s", (job_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    else:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

def get_all_events() -> list:
    today = datetime.now().date()
    from datetime import timedelta
    start_of_week = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
    
    conn = get_db_connection()
    if USE_POSTGRES:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM events WHERE date >= %s ORDER BY date ASC", (start_of_week,))
        rows = cursor.fetchall()
        conn.close()
        events = []
        for row in rows:
            event_dict = dict(row)
            if isinstance(event_dict["sources"], str):
                event_dict["sources"] = json.loads(event_dict["sources"])
            events.append(event_dict)
        return events
    else:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE date >= ? ORDER BY date ASC", (start_of_week,))
        rows = cursor.fetchall()
        conn.close()
        events = []
        for row in rows:
            event_dict = dict(row)
            if isinstance(event_dict["sources"], str):
                event_dict["sources"] = json.loads(event_dict["sources"])
            events.append(event_dict)
        return events

def get_event_by_id(event_id: str) -> dict:
    conn = get_db_connection()
    if USE_POSTGRES:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM events WHERE event_id = %s", (event_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            event_dict = dict(row)
            if isinstance(event_dict["sources"], str):
                event_dict["sources"] = json.loads(event_dict["sources"])
            return event_dict
        return None
    else:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE event_id = ?", (event_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            event_dict = dict(row)
            if isinstance(event_dict["sources"], str):
                event_dict["sources"] = json.loads(event_dict["sources"])
            return event_dict
        return None
