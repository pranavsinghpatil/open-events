import os
import uuid
import json
import logging
import ssl
import time
import urllib.request
import urllib.error
from datetime import datetime
from app.config import (
    BRIGHT_DATA_API_KEY,
    BRIGHT_DATA_ZONE,
    BRIGHT_DATA_FULLHYD_COLLECTOR,
    BRIGHT_DATA_HIGHAPE_COLLECTOR,
    BRIGHT_DATA_AROUNDU_COLLECTOR
)

logger = logging.getLogger(__name__)

# Registry Collector mapping for Hyderabad pilot
COLLECTOR_REGISTRY = {
    "fullhyd": {
        "collector_id": BRIGHT_DATA_FULLHYD_COLLECTOR,
        "site_name": "FullHyd",
        "url": "https://events.fullhyderabad.com"
    },
    "highape": {
        "collector_id": BRIGHT_DATA_HIGHAPE_COLLECTOR,
        "site_name": "HighApe",
        "url": "https://highape.com/hyderabad"
    },
    "aroundu": {
        "collector_id": BRIGHT_DATA_AROUNDU_COLLECTOR,
        "site_name": "AroundU",
        "url": "https://aroundu.in/city/hyderabad"
    }
}

def fetch_live_brightdata_scraper(collector_id: str, target_url: str) -> list:
    """
    Triggers a live scrape via Bright Data Scraper Studio Trigger API.
    Endpoint: https://api.brightdata.com/dca/trigger?collector={collector_id}&override_incompatible_schema=1
    """
    if not BRIGHT_DATA_API_KEY:
        logger.info("No BRIGHT_DATA_API_KEY found in .env. Using raw scraped JSON file fallback.")
        return None

    try:
        ctx = ssl._create_unverified_context()
        api_url = f"https://api.brightdata.com/dca/trigger?collector={collector_id}&override_incompatible_schema=1"
        payload = json.dumps([{"url": target_url}]).encode("utf-8")
        
        req = urllib.request.Request(
            api_url,
            data=payload,
            headers={
                "Authorization": f"Bearer {BRIGHT_DATA_API_KEY}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, context=ctx, timeout=20) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            logger.info(f"Bright Data live trigger response for collector {collector_id}: {data}")
            
            if isinstance(data, list) and len(data) > 0:
                for item in data:
                    if isinstance(item, dict):
                        item["is_live_data"] = True
                return data
            elif isinstance(data, dict):
                if "data" in data and isinstance(data["data"], list) and len(data["data"]) > 0:
                    for item in data["data"]:
                        if isinstance(item, dict):
                            item["is_live_data"] = True
                    return data["data"]
                elif "collection_id" in data:
                    collection_id = data["collection_id"]
                    logger.info(f"Bright Data live trigger queued job collection_id={collection_id}. Polling for finished dataset...")
                    dataset_url = f"https://api.brightdata.com/dca/dataset?id={collection_id}"
                    for poll_attempt in range(8):
                        time.sleep(3)
                        try:
                            d_req = urllib.request.Request(
                                dataset_url,
                                headers={"Authorization": f"Bearer {BRIGHT_DATA_API_KEY}"}
                            )
                            with urllib.request.urlopen(d_req, context=ctx, timeout=15) as d_res:
                                d_body = d_res.read().decode("utf-8")
                                d_json = json.loads(d_body)
                                if isinstance(d_json, list) and len(d_json) > 0:
                                    logger.info(f"Successfully fetched {len(d_json)} LIVE items from Bright Data collection_id={collection_id}!")
                                    for item in d_json:
                                        if isinstance(item, dict):
                                            item["is_live_data"] = True
                                    return d_json
                                elif isinstance(d_json, dict) and "status" in d_json:
                                    logger.info(f"Polling Bright Data collection {collection_id}: {d_json.get('status')} - {d_json.get('message')}")
                        except Exception as pe:
                            logger.warning(f"Polling Bright Data collection {collection_id} attempt {poll_attempt+1}: {pe}")
            return None
            
    except Exception as e:
        logger.error(f"Live Bright Data Scraper call failed for collector {collector_id}: {str(e)}")
        return None

def load_real_scraped_file(target: str = "fullhyd") -> list:
    """Loads raw scraped items from local mock JSON fixture files if available."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    
    target_lower = target.lower()
    file_map = {
        "fullhyd": os.path.join(repo_root, "data", "fixtures", "fullhyd_raw.json"),
        "highape": os.path.join(repo_root, "data", "fixtures", "highape_raw.json"),
        "aroundu": os.path.join(repo_root, "data", "fixtures", "aroundu_raw.json"),
        "hydhub": os.path.join(repo_root, "data", "fixtures", "scraped_mock_data.json"),
        "all": os.path.join(repo_root, "data", "fixtures", "scraped_mock_data.json")
    }
    
    selected_path = None
    for key, path in file_map.items():
        if key in target_lower:
            selected_path = path
            break
            
    if not selected_path:
        selected_path = file_map["all"]

    if os.path.exists(selected_path):
        try:
            with open(selected_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    logger.info(f"Loaded {len(data)} raw items from {selected_path}")
                    return data
        except Exception as e:
            logger.error(f"Failed loading raw scraped file {selected_path}: {str(e)}")
            
    return None

def collect_raw_dataset(target: str, inject_errors: bool = False) -> list:
    """
    Collects raw event listings from target platforms: FullHyd, HighApe, AroundU.
    1. Attempts live Bright Data API call if BRIGHT_DATA_API_KEY is available.
    2. Attempts loading raw scraped JSON files if present on disk.
    3. Falls back to sample listings simulation.
    """ "FullHyd"
    timestamp = datetime.utcnow().isoformat() + "Z"
    target_key = target.lower() #fullhyd 
    
    # 1. Live Bright Data Scraper Studio Call
    collector_info = None
    for key, info in COLLECTOR_REGISTRY.items():
        if key in target_key:
            collector_info = info
            break
            
    if collector_info and BRIGHT_DATA_API_KEY:
        live_data = fetch_live_brightdata_scraper(collector_info["collector_id"], collector_info["url"])
        if live_data and isinstance(live_data, list) and len(live_data) > 0:
            logger.info(f"Successfully received {len(live_data)} raw items from Bright Data Scraper Studio ({collector_info['collector_id']}).")
            return live_data

    # 2. Local Raw Scraped JSON Fixtures
    real_file_data = load_real_scraped_file(target)
    if real_file_data:
        if inject_errors:
            real_file_data = [dict(item) for item in real_file_data]
            real_file_data[0]["venue_name"] = None
        return real_file_data

    # 3. Fallback High-Fidelity Samples
    logger.info(f"Using high-fidelity sample listings for target '{target}'")
    return [
        {
            "raw_id": str(uuid.uuid4()),
            "raw_title": "Hyderabad Literary & Theatre Festival",
            "raw_category": "Theatre & Cultural",
            "raw_date": "2026-08-28",
            "raw_time": "18:00",
            "venue_name": "Ravindra Bharathi Auditorium" if not inject_errors else None,
            "locality": "Lakdikapul",
            "ticket_price": "Free Entry",
            "blurb": "Annual literary meet with theatre performances, poetry readings, and book discussions.",
            "source_site": "FullHyd",
            "source_url": "https://events.fullhyderabad.com/theatre-fest-2026",
            "scraped_at": timestamp
        }
    ]
