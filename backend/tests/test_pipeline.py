import unittest
import asyncio
import os
import json
from datetime import datetime

from app.database import init_db, get_job, get_all_events, get_db_connection
from app.scraper.collector import collect_raw_dataset
from app.scraper.validator import validate_event_schema, run_self_healing
from app.processor.normalizer import normalize_events, map_category, parse_date
from app.processor.deduplicator import deduplicate_events
from app.main import list_events, get_weekly_digest, trigger_scrape, check_job
from app.orchestrator import run_pipeline

class TestCityEventsPipeline(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    def tearDown(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM events")
        cursor.execute("DELETE FROM jobs")
        cursor.execute("DELETE FROM metrics_history")
        conn.commit()
        conn.close()

    def test_collector_and_error_injection(self):
        """Tests scraper collector produces raw event listings and handles error injection."""
        fullhyd_clean = collect_raw_dataset("FullHyd", inject_errors=False)
        self.assertTrue(len(fullhyd_clean) > 0)
        self.assertIsNotNone(fullhyd_clean[0]["venue_name"])
        
        fullhyd_faulty = collect_raw_dataset("FullHyd", inject_errors=True)
        self.assertTrue(len(fullhyd_faulty) > 0)
        self.assertIsNone(fullhyd_faulty[0]["venue_name"])

    def test_validator_and_self_healing(self):
        """Tests health validator diagnoses missing venue and self-healing restores it."""
        faulty_item = {
            "raw_title": "Theatre Festival 2026",
            "raw_date": "2026-08-28",
            "venue_name": None,
            "source_url": "https://events.fullhyderabad.com/ravindra-bharathi"
        }
        errors = validate_event_schema(faulty_item)
        self.assertTrue(len(errors) > 0)
        
        healed_item, logs = run_self_healing(faulty_item, errors)
        self.assertEqual(healed_item["venue_name"], "Ravindra Bharathi Auditorium")
        self.assertEqual(len(validate_event_schema(healed_item)), 0)

    def test_normalizer_date_and_taxonomy_mapping(self):
        """Tests parsing raw date text and mapping categories to Unified Taxonomy."""
        self.assertEqual(parse_date("28/08/2026"), "2026-08-28")
        self.assertEqual(map_category("Live Concerts"), "Music")
        self.assertEqual(map_category("Stage Plays & Arts"), "Theatre & Arts")
        self.assertEqual(map_category("Tech Workshop"), "Workshops & Classes")

        raw_data = [
            {
                "raw_title": " Acoustic Night ",
                "raw_category": "Live Concerts",
                "raw_date": "2026-08-31",
                "raw_time": "Evening",
                "venue_name": "Hard Rock Cafe",
                "source_site": "HydHub",
                "source_url": "https://hydhub.in/events/acoustic"
            }
        ]
        normalized = normalize_events(raw_data)
        self.assertEqual(normalized[0]["title"], "Acoustic Night")
        self.assertEqual(normalized[0]["category"], "Music")

    def test_fuzzy_deduplication(self):
        """Tests fuzzy token matching merges duplicate events from different sources."""
        items = [
            {
                "title": "Hyderabad Literary Festival 2026",
                "category": "Theatre & Arts",
                "date": "2026-08-28",
                "time": "18:00",
                "venue": "Ravindra Bharathi Auditorium",
                "area": "Lakdikapul",
                "price": "Free Entry",
                "description": "Annual literary festival.",
                "site_name": "FullHyd",
                "source_url": "https://events.fullhyderabad.com/litfest",
                "scraped_at": "2026-08-22T12:00:00Z"
            },
            {
                "title": "Hyderabad Literary & Theatre Festival",
                "category": "Theatre & Arts",
                "date": "2026-08-28",
                "time": "18:00",
                "venue": "Ravindra Bharathi Auditorium",
                "area": "Lakdikapul",
                "price": "Free",
                "description": "Literary festival.",
                "site_name": "HydHub",
                "source_url": "https://hydhub.in/events/litfest",
                "scraped_at": "2026-08-22T12:00:00Z"
            }
        ]
        merged, stats = deduplicate_events(items)
        self.assertEqual(stats["raw_count"], 2)
        self.assertEqual(stats["merged_count"], 1)
        self.assertEqual(stats["duplicates_removed"], 1)
        self.assertEqual(len(merged[0]["sources"]), 2)

    def test_end_to_end_pipeline_and_api(self):
        """Tests full pipeline run and API digest endpoints."""
        res_fullhyd = self.loop.run_until_complete(
            run_pipeline("job_test_1", "FullHyd", inject_errors=False)
        )
        self.assertEqual(res_fullhyd["status"], "success")
        
        res_hydhub = self.loop.run_until_complete(
            run_pipeline("job_test_2", "HydHub", inject_errors=False)
        )
        self.assertEqual(res_hydhub["status"], "success")
        
        # Query list events API
        events_res = list_events()
        self.assertTrue(events_res["total"] > 0)
        
        # Query weekly digest API
        digest_res = get_weekly_digest()
        self.assertEqual(digest_res["city"], "Hyderabad")
        self.assertTrue(digest_res["total_events"] > 0)

if __name__ == "__main__":
    unittest.main()
