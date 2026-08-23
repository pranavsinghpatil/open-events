# Hackathon Compliance & Strategy

> Rule compliance, technical story, and submission checklist for OpenEvents — City Leisure Events Aggregator (Hyderabad Pilot).

---

# Hackathon Rule Compliance Checklist

- [x] **Rule 3 & 5 (Custom Scrapers)**: Uses Bright Data Scraper Studio to build custom scrapers per site (FullHyd, HydHub, AroundU), not pre-built marketplace scrapers.
- [x] **Rule 6 (Public Pages Only)**: Targets only publicly available event pages. No login, OTP, paywalls, or personal data.
- [x] **Rule 7 (No Government Sites)**: Targets privately run event platforms only.
- [x] **Rule 8 (Hackathon Timeline)**: Core coding executes within hackathon window.
- [x] **Rule 10 (Deliverables)**: Public repo, clear README, example structured output JSON, demo video, and Scraper Studio usage documentation.
- [x] **Rule 11 (AI Disclosure)**: AI coding assistant usage (Google DeepMind Antigravity / Gemini, OpenAI Codex) disclosed in README.
- [x] **Rule 12 (Team Reproducibility)**: Team understands architecture and scraper logic.

---

# Submission Deliverables Checklist

- [x] Example structured output file committed in repo (`data/samples/hyderabad_merged_events.json`)
- [x] Scraper Studio Collector IDs registered in `configs/scraper_registry.json`
- [x] Unified Category Taxonomy mapped
- [x] Fuzzy de-duplication demonstrated
- [x] Self-healing failure detection verified