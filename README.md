# OpenEvents

> City leisure events aggregation and deduplication pipeline.

<div align="center">

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB?style=flat-square)](https://react.dev)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js-black?style=flat-square)](https://threejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**[Live Demo](https://open-events.vercel.app/)** • **[Architecture Details](docs/architecture.md)** • **[API Contract](docs/api-contract.md)**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Self-Healing & Pipeline Resilience](#self-healing--pipeline-resilience)
- [Fuzzy Deduplication & Normalization](#fuzzy-deduplication--normalization)
- [Quickstart](#quickstart)
- [Running Tests](#running-tests)
- [Data Collection (Bright Data)](#data-collection-bright-data)
- [License](#license)

---

## Overview

**OpenEvents** aggregates urban leisure events — live music, theatre, workshops, tech meetups, sports, and art exhibits — across Hyderabad from multiple independent public event directories:

| Source | Domain |
|---|---|
| **FullHyd Events** | `events.fullhyderabad.com` |
| **HydHub** | `hydhub.in` |
| **AroundU** | `aroundu.in/city/hyderabad` |

The system uses custom scrapers built in **Bright Data Scraper Studio**, validates raw payloads against a unified schema, applies fuzzy string matching to eliminate cross-posted duplicates, and serves the clean data through a FastAPI backend and a React dashboard with a 3D spatial orbit visualization.

🔗 **Try it live:** [open-events.vercel.app](https://open-events.vercel.app/)

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
                    │
                    ▼
React Frontend (Hero HUD, WebGL Scene, Bento Grid, Weekly Timeline)
```

---

## Self-Healing & Pipeline Resilience

Web scrapers often break when target websites modify their DOM structure or class names. OpenEvents handles this with a validation-and-fallback flow:

1. **Schema Validation** — Each incoming record is checked for mandatory fields (`title`, `date`, `venue`).
2. **Drift Detection** — If field-extraction drop-off exceeds a threshold, the ingestion layer flags the run as degraded.
3. **Fallback Resolution** — Backup parsing rules and secondary selectors are triggered automatically to recover missing attributes before writing to the database.
4. **Telemetry Logging** — Execution stats and failure reasons are logged and accessible via the Scraper Control Console.

---

## Fuzzy Deduplication & Normalization

Cross-posted events frequently contain minor spelling differences, truncated venue names, or varying date formats. The deduplication module calculates a composite similarity score using weighted distance algorithms:

| Signal | Weight | Method |
|---|---|---|
| **Title Similarity** | 50% | Normalized Levenshtein distance on lowercase, punctuation-stripped titles |
| **Date Matching** | 30% | Exact match or adjacent time-slot window |
| **Venue & Locality Proximity** | 20% | Jaro-Winkler string similarity over venue and neighborhood fields |

Pairs with a composite score of **0.85 or higher** are merged into a canonical record, preserving all original source links in a `sources` provenance array.

---

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the Repository

```bash
git clone https://github.com/pranavsinghpatil/open-events.git
cd open-events
```

### 2. Backend Service

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Application

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

Open `http://localhost:5173` to access the application locally, or visit the hosted version at **[open-events.vercel.app](https://open-events.vercel.app/)**.

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

## Data Collection (Bright Data)

OpenEvents utilizes **Bright Data Scraper Studio** to reliably aggregate event data from public sources. Custom collectors are deployed for each target domain to ensure robust, scalable data extraction. This raw data is then fed into the pipeline for validation, normalization, and deduplication.

---

## License

This project is licensed under the [MIT License](LICENSE).
