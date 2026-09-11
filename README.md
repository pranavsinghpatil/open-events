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

**[Live Demo](https://open-events.vercel.app/)** • **[Demo Video](#demo-video)** • **[Hackathon Overview](https://www.wemakedevs.org/hackathons/scrape-verse)** • **[Bright Data Integration](docs/brightdata.md)** • **[Architecture Details](docs/architecture.md)** • **[API Contract](docs/api-contract.md)**

</div>

---

## Demo Video

[![OpenEvents Demo Video](https://img.youtube.com/vi/fBn6OUXb1rI/maxresdefault.jpg)](https://youtu.be/fBn6OUXb1rI)

> Full video walkthrough demonstrating Bright Data custom scrapers, self-healing failovers, fuzzy deduplication, and the interactive dashboard: **[Watch on YouTube](https://youtu.be/fBn6OUXb1rI)**.  
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

## Quickstart

> **Live deployment**: [https://open-events.vercel.app/](https://open-events.vercel.app/) — no local setup required to try the app.

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- A [Bright Data](https://brightdata.com) account with Scraper Studio access

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/pranavsinghpatil/open-events.git
cd open-events

# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation: [`http://localhost:8000/docs`](http://localhost:8000/docs)

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