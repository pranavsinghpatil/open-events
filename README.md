# OpenEvents

> City leisure events aggregation and deduplication pipeline powered by Bright Data.

<div align="center">

[![Hackathon](https://img.shields.io/badge/WeMakeDevs-Into_the_Scrape--Verse-0052FF?style=flat-square)](https://www.wemakedevs.org/hackathons/scrape-verse)
[![Powered by Bright Data](https://img.shields.io/badge/Powered_by-Bright_Data-FF4D00?style=flat-square)](https://brightdata.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB?style=flat-square)](https://react.dev)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js-black?style=flat-square)](https://threejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**[Live Demo](http://localhost:5173)** • **[Demo Video](#demo-video)** • **[Hackathon Overview](https://www.wemakedevs.org/hackathons/scrape-verse)** • **[Bright Data Integration](docs/brightdata.md)** • **[Architecture Details](docs/architecture.md)** • **[API Contract](docs/api-contract.md)**

</div>

---

## Demo Video

[![OpenEvents Demo Video](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

> Full video walkthrough demonstrating Bright Data custom scrapers, self-healing failovers, fuzzy deduplication, and the interactive dashboard: **[Watch on YouTube](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)**.  
> Step-by-step presentation script is documented in [`docs/demo.md`](docs/demo.md).

---

## Overview

OpenEvents aggregates urban leisure events (live music, theatre, workshops, tech meetups, sports, art exhibits, food festivals) across Hyderabad from multiple independent public event directories:

- **FullHyd Events** (`events.fullhyderabad.com`)
- **HydHub** (`hydhub.in`)
- **AroundU** (`aroundu.in/city/hyderabad`)

The system uses custom scrapers built in **Bright Data Scraper Studio**, validates raw payloads against a unified schema, applies fuzzy string matching to eliminate cross-posted duplicates, and serves the clean data through a FastAPI backend and a React dashboard with 3D spatial orbit visualization.

---

## Architecture

```text
Public Web Sources (FullHyd, HydHub, AroundU)
                    |
                    v
Bright Data Scraper Studio (Cloud Collectors & Proxies)
                    |
                    v
Ingestion & Health Validator (Schema drift detection & fallback)
                    |
                    v
Normalization Engine (ISO-8601 temporal parser & taxonomy mapping)
                    |
                    v
Fuzzy Deduplication Engine (Jaro-Winkler & Levenshtein matching)
                    |
                    v
SQLite Database (Time-series canonical event store)
                    |
                    v
FastAPI Service (/api/events, /api/venues, /api/scrapers/trigger)
                    |
                    v
React Frontend (Hero-13 HUD, WebGL Scene, Bento Grid, Weekly Timeline)
```

---

## Bright Data Integration

In accordance with Hackathon Rules 3 and 5, all scrapers are custom-built per target source in **Bright Data Scraper Studio** rather than using generic marketplace templates.

### Registered Collectors (`configs/scraper_registry.json`)

| Collector Name | Collector ID | Target URL | Target Categories |
|---|---|---|---|
| `fullhyd_events_collector` | `c_fullhyd_events` | `events.fullhyderabad.com` | Music, Theatre, Dance, Workshops, Sports |
| `hydhub_events_collector` | `c_hydhub_events` | `hydhub.in` | Concerts, Meetups, Talks, Nightlife |
| `aroundu_events_collector` | `c_aroundu_events` | `aroundu.in/city/hyderabad` | Community Meetups, Food, Arts |

---

## Self-Healing & Pipeline Resilience

Web scrapers often break when target websites modify their DOM structure or class names. OpenEvents handles this with a validation and fallback flow:

1. **Schema Validation**: Each incoming record is checked for mandatory fields (`title`, `date`, `venue`).
2. **Drift Detection**: If field extraction drop-off exceeds threshold limits, the ingestion layer flags the run as degraded.
3. **Fallback Resolution**: Backup parsing rules and secondary selectors are triggered automatically to recover missing attributes before writing to the database.
4. **Telemetry Logging**: Execution stats and failure reasons are logged and accessible via the Scraper Control Console.

---

## Fuzzy Deduplication & Normalization

Cross-posted events frequently contain minor spelling differences, truncated venue names, or varying date formats. The deduplication module calculates composite similarity using weighted distance algorithms:

- **Title Similarity (50%)**: Normalized Levenshtein distance on lowercase, punctuation-stripped titles.
- **Date Matching (30%)**: Exact match or adjacent time-slot window.
- **Venue & Locality Proximity (20%)**: Jaro-Winkler string similarity over venue and neighborhood fields.

Pairs with a composite score of **0.85 or higher** are merged into a canonical record preserving all original source links in a `sources` provenance array.

---

## Unified Data Schema

Sample output file: [`data/samples/hyderabad_merged_events.json`](data/samples/hyderabad_merged_events.json)

```json
{
  "event_id": "evt_hyd_0842",
  "title": "Hyderabad Indie Acoustic Showcase",
  "category": "Music",
  "date": "2026-08-28",
  "time": "19:30",
  "venue": "The Moonshine Project",
  "area": "Jubilee Hills",
  "price": "INR 499",
  "description": "Live acoustic performances featuring indie songwriters and classical fusion sets.",
  "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
  "sources": [
    {
      "site_name": "FullHyd",
      "source_url": "https://events.fullhyderabad.com/indie-acoustic-0842"
    },
    {
      "site_name": "HydHub",
      "source_url": "https://hydhub.in/concerts/indie-acoustic-showcase"
    }
  ],
  "confidence_score": 0.96,
  "scraped_at": "2026-08-23T18:30:00Z"
}
```

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Service

```bash
# Clone the repository
git clone https://github.com/pranavsinghpatil/open-events.git
cd open-events

# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Application

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` to access the application.

---

## Running Tests

Run the pipeline test suite covering ingestion, taxonomy normalization, fuzzy deduplication, and API endpoints:

```bash
# Windows PowerShell
$env:PYTHONPATH="backend"; python -m unittest backend/tests/test_pipeline.py

# Linux / macOS
PYTHONPATH=backend python -m unittest backend/tests/test_pipeline.py
```

---

## Hackathon Compliance & AI Disclosure

- **Rule 3 & 5 (Custom Scrapers)**: Custom collectors written in Bright Data Scraper Studio for each target domain.
- **Rule 6 (Public Pages Only)**: Targets publicly viewable event listing pages. No login, session tokens, or private user data.
- **Rule 7 (No Government Sites)**: Sources are privately operated leisure event platforms.
- **Rule 10 (Deliverables)**: Source code, sample data payload, architecture documentation, and setup instructions provided.
- **Rule 11 (AI Disclosure)**: AI tooling (Google DeepMind Antigravity / Gemini, OpenAI Codex) was used during development for component scaffolding, algorithmic reference, and test generation. All system design, pipeline logic, and scraper workflows were built during the hackathon period.

---

## License

This project is licensed under the [MIT License](LICENSE).
