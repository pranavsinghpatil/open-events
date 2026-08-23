import pandas as pd
from datetime import datetime
import re
import json

UNIFIED_TAXONOMY = [
    "Music",
    "Theatre & Arts",
    "Workshops & Classes",
    "Sports & Outdoors",
    "Food & Drink",
    "Talks & Meetups",
    "Nightlife",
    "Family / Kids",
    "Exhibitions"
]

HYDERABAD_AREAS = [
    "Madhapur", "Jubilee Hills", "Banjara Hills", "Gachibowli", "Hitech City",
    "Lakdikapul", "Film Nagar", "Kondapur", "Begumpet", "Secunderabad",
    "Panjagutta", "Khairatabad", "Raidurg", "Ramanthapur", "Kukatpally", "Miyapur",
    "Chandrashila", "Vattavada"
]

def clean_site_name(raw_site: str) -> str:
    """Cleans source site strings (e.g. 'AroundU. All rights reserved.2026' -> 'AroundU')."""
    if not raw_site:
        return "FullHyd"
    s = str(raw_site).strip()
    if "aroundu" in s.lower():
        return "AroundU"
    elif "highape" in s.lower():
        return "HighApe"
    elif "fullhyd" in s.lower():
        return "FullHyd"
    elif "hydhub" in s.lower():
        return "HydHub"
    return s

def map_category(raw_cat: str) -> str:
    """Maps raw source category strings into the Unified Category Taxonomy."""
    if not raw_cat:
        return "Talks & Meetups"
        
    cat_lower = str(raw_cat).lower()
    
    if any(k in cat_lower for k in ["kid", "family"]):
        return "Family / Kids"
    elif any(k in cat_lower for k in ["music", "concert", "dj", "band", "acoustic", "sing", "song"]):
        return "Music"
    elif any(k in cat_lower for k in ["theatre", "art", "play", "stage", "comedy", "cultural", "literary", "film", "movie", "craft"]):
        return "Theatre & Arts"
    elif any(k in cat_lower for k in ["workshop", "class", "tech", "learning"]):
        return "Workshops & Classes"
    elif any(k in cat_lower for k in ["sport", "outdoor", "run", "fitness", "hike", "trek", "camping", "adventure", "travel", "tour"]):
        return "Sports & Outdoors"
    elif any(k in cat_lower for k in ["food", "drink", "dining", "tasting", "gourmet"]):
        return "Food & Drink"
    elif any(k in cat_lower for k in ["nightlife", "club", "single", "party"]):
        return "Nightlife"
    elif any(k in cat_lower for k in ["exhibition", "expo", "gallery", "showcase"]):
        return "Exhibitions"
    elif any(k in cat_lower for k in ["talk", "meetup", "social", "conference", "speech", "political", "networking", "mixer"]):
        return "Talks & Meetups"
        
    return "Talks & Meetups"

def parse_date(date_str: str) -> str:
    """
    Parses various date text formats across FullHyd, HighApe, AroundU:
    - "23-Aug-26" -> "2026-08-23"
    - "27-Jun-26 22-Aug-26" -> "2026-08-22" (takes latest/upcoming bound)
    - "Sun, 23 Aug, 2026 · 02:00 PM to 05:00 PM" -> "2026-08-23"
    - "Sat, 19 Sept, 2026 · 10:00 AM to 10:00 PM" -> "2026-09-19"
    - "23 Aug" / "29 Aug" -> "2026-08-23" / "2026-08-29"
    """
    if not date_str:
        return datetime.utcnow().strftime("%Y-%m-%d")
        
    date_str = str(date_str).strip()
    
    # 1. HighApe format: "Sun, 23 Aug, 2026 · 02:00 PM..." or "Sat, 19 Sept, 2026..."
    match_highape = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,4}),?\s+(\d{4})\b", date_str)
    if match_highape:
        day, month_str, year = match_highape.groups()
        month_str = month_str[:3]
        try:
            dt = datetime.strptime(f"{day}-{month_str}-{year}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 2. FullHyd format: "23-Aug-26" or range "27-Jun-26 22-Aug-26" (take end date for multi-day ranges)
    tokens = date_str.split()
    target_token = tokens[-1] if len(tokens) > 1 and "-" in tokens[-1] else tokens[0]
    
    match_dmy = re.match(r"^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$", target_token)
    if match_dmy:
        day, month_str, year = match_dmy.groups()
        if len(year) == 2:
            year = "20" + year
        try:
            dt = datetime.strptime(f"{day}-{month_str}-{year}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 3. AroundU format: "23 Aug" or "29 Aug" (short date without year)
    match_short = re.match(r"^(\d{1,2})\s+([A-Za-z]{3})$", date_str)
    if match_short:
        day, month_str = match_short.groups()
        current_year = datetime.utcnow().year
        try:
            dt = datetime.strptime(f"{day}-{month_str}-{current_year}", "%d-%b-%Y")
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 4. Standard slash format: DD/MM/YYYY
    match_slash = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", target_token)
    if match_slash:
        day, month, year = match_slash.groups()
        return f"{year}-{month}-{day}"
        
    try:
        dt = pd.to_datetime(target_token)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return datetime.utcnow().strftime("%Y-%m-%d")

def parse_time(time_str: str) -> str:
    """Parses raw time strings (e.g., '7:00pm', '02:00 PM', '5:00 PM - 7:30 PM')."""
    if not time_str:
        return "Evening"
        
    time_str = str(time_str).strip()
    
    match_time = re.search(r"(\d{1,2}:\d{2}\s*(?:am|pm)?)", time_str, re.IGNORECASE)
    if match_time:
        return match_time.group(1).lower().replace(" ", "")
        
    match_hour = re.search(r"(\d{1,2}\s*(?:am|pm))", time_str, re.IGNORECASE)
    if match_hour:
        return match_hour.group(1).lower().replace(" ", "")
        
    return "Evening"

def parse_price(price_raw) -> str:
    """
    Parses raw ticket prices:
    - Dict: {"value": 500, "currency": "INR", "symbol": "₹"} -> "₹500"
    - String / None / 0 -> "Free Entry"
    """
    if not price_raw:
        return "Free Entry"
        
    if isinstance(price_raw, dict):
        val = price_raw.get("value")
        sym = price_raw.get("symbol", "₹")
        if val is None or val == 0:
            return "Free Entry"
        return f"{sym}{val}"
        
    price_str = str(price_raw).strip()
    if price_str.lower() in ["0", "free", "none", ""]:
        return "Free Entry"
    return price_str

def extract_venue_and_area(venue_raw: str, locality_raw: str) -> tuple:
    """
    Cleans venue name and extracts locality area:
    - "Third Wave Coffee | Gachibowli" -> ("Third Wave Coffee", "Gachibowli")
    - "Madhapur Exact location / landmark:" -> ("Madhapur", "Madhapur")
    """
    venue_str = str(venue_raw or "City Venue").strip()
    
    # Strip trailing "Exact location / landmark:"
    venue_str = re.sub(r"\s+Exact location\s*/\s*landmark:?", "", venue_str, flags=re.IGNORECASE).strip()
    
    # Split "Third Wave Coffee | Gachibowli"
    if "|" in venue_str:
        parts = [p.strip() for p in venue_str.split("|") if p.strip()]
        venue_clean = parts[0]
        area_candidate = parts[1] if len(parts) > 1 else locality_raw
    else:
        venue_clean = venue_str
        area_candidate = locality_raw

    # Extract area
    combined_loc = f"{area_candidate} {locality_raw}"
    extracted_area = "Hyderabad"
    
    for area in HYDERABAD_AREAS:
        if re.search(r"\b" + re.escape(area) + r"\b", combined_loc, re.IGNORECASE):
            extracted_area = area
            break
            
    if extracted_area == "Hyderabad" and area_candidate:
        parts = [p.strip() for p in str(area_candidate).split(",") if p.strip()]
        if parts:
            extracted_area = parts[0]
            
    return venue_clean, extracted_area

def is_this_week_or_future(date_str: str) -> bool:
    """Checks if a YYYY-MM-DD date string falls in the current week or the future."""
    if not date_str:
        return True
    try:
        today = datetime.now().date()
        from datetime import timedelta
        start_of_week = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
        return date_str >= start_of_week
    except Exception:
        return True

def normalize_events(raw_items: list) -> list:
    """
    Normalizes a list of raw event items into the canonical internal structure.
    Filters out past events (only keeps current week or future events).
    """
    if not raw_items:
        return []
        
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    normalized = []
    
    for item in raw_items:
        title = str(item.get("raw_title", "")).strip()
        if not title:
            continue
            
        cat_raw = item.get("raw_category", "")
        category = map_category(cat_raw)
        
        date_raw = item.get("raw_date", "")
        date_clean = parse_date(date_raw)
        
        # Filter out past events
        if not is_this_week_or_future(date_clean):
            continue
        
        time_raw = item.get("raw_time", "")
        time_clean = parse_time(time_raw)
        
        venue_raw = item.get("venue_name", "City Venue")
        locality_raw = item.get("locality", "")
        venue_clean, area_clean = extract_venue_and_area(venue_raw, locality_raw)
        
        price_raw = item.get("ticket_price")
        price_clean = parse_price(price_raw)
        
        desc_clean = str(item.get("blurb", "")).strip()
        site_name = clean_site_name(item.get("source_site"))
        source_url = str(item.get("source_url") or item.get("product_page_url", "")).strip()
        scraped_at = item.get("scraped_at", datetime.utcnow().isoformat() + "Z")
        
        normalized.append({
            "title": title,
            "category": category,
            "date": date_clean,
            "time": time_clean,
            "venue": venue_clean,
            "area": area_clean,
            "price": price_clean,
            "description": desc_clean,
            "site_name": site_name,
            "source_url": source_url,
            "scraped_at": scraped_at
        })
        
    return normalized
