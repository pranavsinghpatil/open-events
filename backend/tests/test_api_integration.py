import unittest
import asyncio
from app.main import (
    health,
    get_categories,
    list_events,
    get_weekly_digest,
    get_event,
    trigger_scrape,
    check_job
)
from app.database import init_db, get_db_connection
from app.orchestrator import run_pipeline

class TestAPIIntegration(unittest.TestCase):
    
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

    def test_health_endpoint(self):
        """Tests GET /health returns status healthy."""
        res = health()
        self.assertEqual(res, {"status": "healthy"})

    def test_categories_endpoint(self):
        """Tests GET /events/categories returns 9 taxonomy items."""
        res = get_categories()
        self.assertIn("categories", res)
        self.assertEqual(len(res["categories"]), 9)
        self.assertIn("Music", res["categories"])
        self.assertIn("Theatre & Arts", res["categories"])

    def test_trigger_and_events_ingestion_flow(self):
        """Tests trigger scrape endpoint POST /scrape and listing ingested events via GET /events."""
        # 1. Trigger FullHyd Scrape
        trig_res = self.loop.run_until_complete(trigger_scrape(target="FullHyd", background=True, inject_errors=False))
        self.assertEqual(trig_res["status"], "triggered")
        self.assertIn("job_id", trig_res)
        
        job_id = trig_res["job_id"]
        
        # Run pipeline for job
        self.loop.run_until_complete(run_pipeline(job_id, "FullHyd", inject_errors=False))
        
        # 2. Check Job status
        job_res = check_job(job_id)
        self.assertEqual(job_res["status"], "COMPLETED")
        
        # 3. List Events API
        events_res = list_events()
        self.assertIn("total", events_res)
        self.assertIn("events", events_res)
        self.assertTrue(events_res["total"] > 0)

    def test_events_filtering_by_category_and_area(self):
        """Tests category and area filtering parameters on GET /events."""
        trig_res = self.loop.run_until_complete(trigger_scrape(target="FullHyd", background=True))
        job_id = trig_res["job_id"]
        self.loop.run_until_complete(run_pipeline(job_id, "FullHyd"))
        
        # Filter by category
        res_cat = list_events(category="Theatre & Arts")
        self.assertTrue("events" in res_cat)
        
        # Filter by area
        res_area = list_events(area="Madhapur")
        self.assertTrue("events" in res_area)

    def test_weekly_digest_endpoint(self):
        """Tests GET /events/digest response structure."""
        trig_res = self.loop.run_until_complete(trigger_scrape(target="FullHyd", background=True))
        job_id = trig_res["job_id"]
        self.loop.run_until_complete(run_pipeline(job_id, "FullHyd"))
        
        digest_res = get_weekly_digest()
        self.assertEqual(digest_res["city"], "Hyderabad")
        self.assertEqual(digest_res["period"], "This Week")
        self.assertIn("total_events", digest_res)
        self.assertIn("unique_venues", digest_res)
        self.assertIn("category_breakdown", digest_res)

if __name__ == "__main__":
    unittest.main()
