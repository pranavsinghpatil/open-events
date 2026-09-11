# OpenEvents

> City leisure events aggregation and deduplication pipeline powered by Bright Data — live at **[open-events.vercel.app](https://open-events.vercel.app/)**.

<div align="center">

[![Hackathon](https://img.shields.io/badge/WeMakeDevs-Into_the_Scrape--Verse-0052FF?style=flat-square)](https://www.wemakedevs.org/hackathons/scrape-verse)
[![Powered by Bright Data](https://img.shields.io/badge/Powered_by-Bright_Data-FF4D00?style=flat-square)](https://brightdata.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.116-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite_5-61DAFB?style=flat-square)](https://react.dev)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js_0.185-black?style=flat-square)](https://threejs.org)
[![Motion](https://img.shields.io/badge/Animation-Motion_13-purple?style=flat-square)](https://motion.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**[Live Demo](https://open-events.vercel.app/)** &nbsp;•&nbsp; **[Demo Video](#demo-video)** &nbsp;•&nbsp; **[Hackathon Overview](https://www.wemakedevs.org/hackathons/scrape-verse)** &nbsp;•&nbsp; **[Bright Data Integration](docs/brightdata.md)** &nbsp;•&nbsp; **[Architecture Details](docs/architecture.md)** &nbsp;•&nbsp; **[API Contract](docs/api-contract.md)**

</div>

---

## Table of Contents

[![OpenEvents Demo Video](https://img.youtube.com/vi/fBn6OUXb1rI/maxresdefault.jpg)](https://youtu.be/fBn6OUXb1rI)

> Full walkthrough demonstrating Bright Data custom scrapers, self-healing failovers, fuzzy deduplication, and the interactive dashboard.
> **[Watch on YouTube](https://youtu.be/fBn6OUXb1rI)** — presentation script documented in [`docs/demo.md`](docs/demo.md).

---

## Executive Summary

Urban event discovery in Hyderabad is fragmented across independently operated listing platforms. Events are cross-posted with minor variations in title, date format, and venue name, making deduplication non-trivial and aggregation unreliable.

OpenEvents addresses this with a fully automated, multi-stage pipeline:

- **Collection**: Three custom scrapers built in Bright Data Scraper Studio harvest events from FullHyd, HydHub, and AroundU.
- **Validation**: Every incoming record is checked against a unified schema; drift in field extraction rates triggers self-healing fallback selectors.
- **Normalization**: Dates are converted to ISO-8601, categories are mapped to a common taxonomy, and venues are canonicalized.
- **Deduplication**: A composite Jaro-Winkler + Levenshtein similarity score merges cross-posted duplicates into a single canonical record with full source provenance.
- **Delivery**: A FastAPI backend serves the clean dataset; a React frontend with Three.js WebGL orbit visualization and Motion-powered micro-animations presents it to the user.

The live deployment is publicly accessible at [open-events.vercel.app](https://open-events.vercel.app/).

---

## Architecture

```text
Public Web Sources (FullHyd, HydHub, AroundU)
                    │
                    ▼
Bright Data Scraper Studio (Cloud Collectors & Proxies)
                    │
                    ▼
Ingestion & Health Validator (Schema drift detection & fallback)
                    │
                    ▼
Normalization Engine (ISO-8601 temporal parser & taxonomy mapping)
                    │
                    ▼
Fuzzy Deduplication Engine (Jaro-Winkler & Levenshtein matching)
                    │
                    ▼
SQLite Database (Time-series canonical event store)
                    │
                    ▼
FastAPI Service (/api/events, /api/venues, /api/scrapers/trigger)
                    |
                    v
React Frontend (Hero HUD, WebGL Scene, Bento Grid, Weekly Timeline)
```

---

## Bright Data Integration

In accordance with Hackathon Rules 3 and 5, all scrapers are custom-built per target source in **Bright Data Scraper Studio** rather than using generic marketplace templates.

## Self-Healing & Pipeline Resilience

Web scrapers break when target websites modify their DOM structure or class names. OpenEvents handles this through a four-stage validation and fallback flow:

## Fuzzy Deduplication & Normalization

Cross-posted events frequently contain minor spelling differences, truncated venue names, or varying date formats. The deduplication module calculates composite similarity using weighted string distance algorithms:

| Signal | Weight | Method |
|---|---|---|
| **Title Similarity** | 50% | Normalized Levenshtein distance on lowercase, punctuation-stripped titles |
| **Date Matching** | 30% | Exact match or adjacent time-slot window |
| **Venue & Locality Proximity** | 20% | Jaro-Winkler string similarity over venue and neighborhood fields |

Pairs with a composite score of **0.85 or higher** are merged into a canonical record. All original source URLs are preserved in a `sources` provenance array on the merged record.

---

## Project Directory Structure

```text
open-events/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment and application settings loader
│   │   ├── database.py            # SQLite schema, migrations, and query layer
│   │   ├── main.py                # FastAPI application entry point and route registration
│   │   ├── orchestrator.py        # Pipeline orchestration and scraper trigger logic
│   │   ├── processor/
│   │   │   ├── deduplicator.py    # Composite similarity scoring and record merging
│   │   │   ├── normalizer.py      # ISO-8601 date parser and taxonomy mapper
│   │   │   └── scoring.py         # Weighted distance algorithm implementations
│   │   └── scraper/
│   │       ├── collector.py       # Bright Data API client and collector invocation
│   │       ├── trigger.py         # Scraper trigger endpoint handler
│   │       └── validator.py       # Schema drift detection and field validation
│   ├── requirements.txt
│   └── tests/
│       ├── test_pipeline.py       # Unit tests: ingestion, normalization, deduplication
│       └── test_api_integration.py# Integration tests: FastAPI endpoint contracts
├── configs/
│   ├── scraper_registry.json      # Registered Bright Data collector IDs and targets
│   └── scoring.yaml               # Deduplication weight configuration
├── data/
│   └── samples/                   # Sample merged event payloads for reference
├── docs/
│   ├── api-contract.md            # REST API endpoint specifications
│   ├── architecture.md            # Extended architecture design document
│   ├── brightdata.md              # Bright Data integration notes
│   ├── data-contract.md           # Unified event schema definition
│   ├── demo.md                    # Presentation walkthrough script
│   └── sources.md                 # Source site analysis and selector documentation
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root application component and route configuration
│   │   ├── components/
│   │   │   ├── CityWebGLScene.jsx         # Three.js 3D spatial orbit visualization
│   │   │   ├── DeduplicationVisualizer.jsx# Live deduplication pipeline visualization
│   │   │   ├── EventCard.jsx              # Event listing card component
│   │   │   ├── FluidNavbar.jsx            # Animated navigation bar
│   │   │   ├── SceneLandingPage.jsx       # Hero landing page with WebGL background
│   │   │   ├── ScraperTelemetryWidget.jsx # Real-time scraper status display
│   │   │   ├── SearchModal.jsx            # Full-screen event search interface
│   │   │   └── TriggerPanel.jsx           # Manual scraper trigger control panel
│   │   ├── lib/
│   │   │   ├── api.ts             # Typed REST API client bindings
│   │   │   └── constants.js       # Application-wide constants and config values
│   │   └── pages/
│   │       ├── HomePage.jsx       # Main dashboard with event feed
│   │       ├── DiscoverPage.jsx   # Category-filtered event discovery
│   │       ├── CalendarPage.jsx   # Weekly calendar timeline view
│   │       ├── EventDetailPage.jsx# Individual event detail and source provenance
│   │       ├── MyWeekPage.jsx     # Personalized weekly event planner
│   │       ├── VenuePage.jsx      # Venue profile and event history
│   │       └── AboutUsPage.jsx    # Project and team information
│   ├── package.json
│   └── vite.config.js
├── schemas/                       # JSON Schema definitions for pipeline validation
├── scripts/                       # Utility scripts for data seeding and maintenance
├── .env.example                   # Environment variable template
├── CONTRIBUTING.md
└── README.md
```

---

## Quickstart

> **Live deployment**: [https://open-events.vercel.app/](https://open-events.vercel.app/) — no local setup required to explore the application.

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher and npm
- A [Bright Data](https://brightdata.com) account with Scraper Studio access

### 1. Clone & Configure Environment

```bash
git clone https://github.com/pranavsinghpatil/open-events.git
cd open-events
```

# Copy the environment template
cp .env.example .env
```

Edit `.env` and supply your credentials:

### 2. Start the Backend

```bash
pip install -r backend/requirements.txt

python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to access the application.

---

## Running Tests

The test suite covers ingestion, taxonomy normalization, fuzzy deduplication, and API endpoint contracts:

```bash
# Windows PowerShell
$env:PYTHONPATH="backend"; python -m unittest discover -s backend/tests

# Linux / macOS
PYTHONPATH=backend python -m unittest discover -s backend/tests
```

---

## Data Collection (Bright Data)

| Rule | Status | Notes |
|------|--------|-------|
| Rule 3 & 5 — Custom Scrapers | Compliant | Custom collectors built in Bright Data Scraper Studio per target domain. No marketplace templates used. |
| Rule 6 — Public Pages Only | Compliant | Targets publicly viewable event listing pages. No authentication, session tokens, or private user data accessed. |
| Rule 7 — No Government Sites | Compliant | All sources are privately operated leisure event platforms. |
| Rule 10 — Deliverables | Compliant | Source code, sample data payload, architecture documentation, API contract, and setup instructions are all provided. |
| Rule 11 — AI Disclosure | Disclosed | Google DeepMind Antigravity / Gemini and OpenAI Codex were used for component scaffolding, algorithmic reference, and test generation. All system design, pipeline logic, and scraper workflows were produced during the hackathon period. |

---

## License

This project is licensed under the [MIT License](LICENSE).