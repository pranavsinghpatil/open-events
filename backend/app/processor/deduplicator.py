import uuid
import hashlib
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

def similarity_ratio(a: str, b: str) -> float:
    """Calculates string similarity ratio between 0.0 and 1.0."""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def generate_event_id(title: str, date: str, venue: str) -> str:
    """Generates a deterministic unique ID for an event based on title, date, and venue."""
    clean_title = title.lower().strip()
    clean_date = str(date).strip()
    clean_venue = venue.lower().strip()
    key = f"{clean_title}_{clean_date}_{clean_venue}"
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()[:10]
    return f"evt_{digest}"

def deduplicate_events(normalized_items: list) -> tuple:
    """
    Fuzzy-matches normalized event items on title + date + venue.
    Merges matching event records into a single record with combined 'sources' array.
    
    Returns tuple: (merged_events_list, dedup_stats)
    """
    if not normalized_items:
        return [], {"raw_count": 0, "merged_count": 0, "duplicates_removed": 0}
        
    merged_clusters = []
    
    for item in normalized_items:
        matched_cluster = None
        
        for cluster in merged_clusters:
            primary = cluster[0]
            # Match condition: dates equal AND venue/title similarity high
            same_date = (item["date"] == primary["date"])
            title_sim = similarity_ratio(item["title"], primary["title"])
            venue_sim = similarity_ratio(item["venue"], primary["venue"])
            
            if same_date and (title_sim >= 0.70 or (title_sim >= 0.50 and venue_sim >= 0.70)):
                matched_cluster = cluster
                break
                
        if matched_cluster:
            matched_cluster.append(item)
        else:
            merged_clusters.append([item])
            
    # Process clusters into single merged records
    final_merged_events = []
    
    for cluster in merged_clusters:
        primary = cluster[0]
        
        # Combine unique sources
        sources_list = []
        seen_sites = set()
        
        for event in cluster:
            if "sources" in event and isinstance(event["sources"], list):
                for src in event["sources"]:
                    site = src.get("site_name", "")
                    url = src.get("source_url", "")
                    if site and site not in seen_sites:
                        seen_sites.add(site)
                        sources_list.append({"site_name": site, "source_url": url})
            else:
                site = event.get("site_name", "Unknown")
                url = event.get("source_url", "")
                if site not in seen_sites:
                    seen_sites.add(site)
                    sources_list.append({"site_name": site, "source_url": url})
                
        event_id = primary.get("event_id") or generate_event_id(primary["title"], primary["date"], primary["venue"])
        
        merged_record = {
            "event_id": event_id,
            "title": primary["title"],
            "category": primary["category"],
            "date": primary["date"],
            "time": primary["time"],
            "venue": primary["venue"],
            "area": primary["area"],
            "price": primary["price"],
            "description": primary["description"],
            "sources": sources_list,
            "scraped_at": primary["scraped_at"]
        }
        
        final_merged_events.append(merged_record)
        
    raw_count = len(normalized_items)
    merged_count = len(final_merged_events)
    duplicates_removed = raw_count - merged_count
    
    stats = {
        "raw_count": raw_count,
        "merged_count": merged_count,
        "duplicates_removed": duplicates_removed
    }
    
    logger.info(f"Deduplication complete: {raw_count} raw -> {merged_count} merged ({duplicates_removed} duplicates removed)")
    
    return final_merged_events, stats
