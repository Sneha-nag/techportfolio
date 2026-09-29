# Mecklenburg County RAG Agent

Local learning project for a North Carolina broker: a **browser chat UI** and a **FastAPI RAG API** that answer questions about **Mecklenburg County open tax/sales data** and **NC Real Estate Commission / license-law notes**.

The FastAPI path uses **Vertex AI Gemini 2.5 Flash** on your GCP project (for example `reenterpriserag`) with Application Default Credentials. Streamlit can use the same Vertex project, or Groq / Gemini AI Studio for learning. Retrieval stays on your machine: **Chroma**, **SQLite**, plus **Redis** and an in-process LRU so repeat queries skip generation.

This is a study tool, not legal, appraisal, or MLS software.

## Architecture

![Architecture](docs/architecture.jpg)

```text
benchmark / httpx ----+
Streamlit chat -------+--> FastAPI /query
CLI meck-agent ask ---+         |
                                v
                     Redis + in-process LRU
                     hit: return answer (~40 ms)
                     miss:
                       Chroma (guidelines)  ||  SQLite (parcels/sales)
                                v
                     Vertex AI Gemini 2.5 Flash
                                v
                     write Redis + LRU, return answer
```

Clients hit FastAPI `POST /query` and `GET /health`. A cache hit returns immediately. A miss retrieves Chroma guidelines and SQLite county records **in parallel**, then calls Vertex, then writes Redis and the LRU. Chroma SQLite is tuned with WAL so concurrent searches wait less on the local DB.

The Streamlit UI and `meck-agent ask` can also run a LangGraph ReAct agent that chooses tools directly (guidelines vs parcel/sales lookup). County **recorded** `saleprice` / `saledate` values are **not MLS solds**.

## Technologies used (and why)

| Tech | Why |
| --- | --- |
| Streamlit | Local chat UI, no hosting |
| FastAPI + uvicorn | Concurrent RAG latency tests (`POST /query`, `GET /health`) |
| Vertex AI (`google-cloud-aiplatform`) | Gemini on your GCP project via ADC + `GOOGLE_CLOUD_PROJECT`; avoids AI Studio RPM/RPD limits and `403 CONSUMER_INVALID` from mixing an AI Studio key with Vertex |
| `gemini-2.5-flash` | Vertex-available Flash model in `us-central1` (`gemini-3.6-flash` is AI Studio only) |
| Chroma | Local guideline vectors |
| SQLite | Parcel/sales lookups without dumping structured records into the vector index |
| Redis + in-process LRU | Repeat queries skip Chroma and Vertex; LRU is fast in-process; Redis keeps hits after a FastAPI restart |
| Chroma SQLite WAL | Concurrent readers wait less on `chroma.sqlite3` lock |
| Hash embeddings | Tests and offline runs with no model download |
| `benchmark.py` | Concurrent latency (avg / p95 / p99) for vector search + Vertex generate |

## What you learn

Two retrieval styles instead of dumping everything into a vector database:

| Kind of question | How it is answered |
| --- | --- |
| Dual agency, WWREA, license law | **RAG** over chunked guideline text in Chroma |
| PIN lookup, “what sold on Oak Street in 2024?” | **SQLite tools** (and FastAPI county-record fetch) |

## Cost

| Piece | Default | Typical cost |
| --- | --- | --- |
| LLM (API) | Vertex AI `gemini-2.5-flash` on your GCP project | Vertex usage; keep the project quota small for learning |
| LLM (UI fallback) | Groq (`llama-3.1-8b-instant`) or Gemini AI Studio | Free tier |
| Embeddings | Hash by default; optional `sentence-transformers/all-MiniLM-L6-v2` on CPU | $0 |
| Vector store | Local Chroma | $0 |
| Parcels / sales | Mecklenburg ArcGIS REST, attributes only | $0 |
| Cache | In-process LRU; optional local Redis | $0 |
| Optional backup | OpenAI `gpt-4o-mini` | Easy to keep under $20 |

Do not plug in paid MLS, Zillow, or hosted RAG platforms for this exercise. Do not set `GOOGLE_API_KEY` on the FastAPI Vertex process; that key is for AI Studio and causes Vertex `CONSUMER_INVALID`.

## Setup

Python 3.11+ recommended.

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
```

For the FastAPI RAG path (Vertex):

1. Create or pick a GCP project (example: `reenterpriserag`) and enable the Vertex AI API.
2. Sign in with Application Default Credentials (not an AI Studio API key):

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project reenterpriserag
```

3. In `.env` set:

```bash
GOOGLE_CLOUD_PROJECT=reenterpriserag
VERTEX_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_BACKEND=hash
```

Optional Streamlit fallbacks if you are not using Vertex: Groq (`LLM_PROVIDER=groq` + `GROQ_API_KEY`) or Gemini AI Studio (`LLM_PROVIDER=gemini` + `GOOGLE_API_KEY`). Gemini 3.x AI Studio models need thought signatures on tool calls; the agent enables that automatically.

If Hugging Face model download is slow, keep `EMBEDDING_BACKEND=hash`. Quality drops; ingest and tests still run.

## Run the FastAPI RAG API

```bash
meck-agent serve
```

Binds `http://127.0.0.1:8000`. Check `GET /health` (`vertex_ready`, `chroma_ready`, `redis_ready`) and `POST /query` with `{"query": "...", "k": 5}`.

Optional Redis (survives a server restart). Leave `REDIS_URL` unset to use in-process LRU only:

```bash
python -m meck_agent.cache
```

Then set `REDIS_URL=redis://127.0.0.1:6379/0` and restart `meck-agent serve`.

## Latency benchmark

With the API running:

```bash
python benchmark.py --n 25 --concurrency 25
```

Reports wall-clock, average, p95, and p99 for end-to-end latency, plus server-reported retrieve vs Vertex generate times. Warm Redis hits skip Chroma and Gemini (retrieve/generate ~0 ms).

## Run the UI

```bash
streamlit run app.py
```

or:

```bash
meck-agent ui
```

Then open the URL Streamlit prints (usually http://localhost:8501).

In the sidebar:

1. **Load sample parcels & sales**
2. **Index sample guidelines**
3. Ask a question, or click an example

Live county download (ZIP/street subset, no polygons) is also in the sidebar.

## Example questions

- What does NC require when I work with a buyer as a dual agent?
- Look up parcel 12501234 and its last recorded sale.
- What sold on Oak Street in 2024 according to county records?

Optional terminal commands still work for ingest and one-off asks:

```bash
meck-agent ingest --sample
meck-agent ingest-docs --sample-only
meck-agent ask "Look up parcel 12501234"
```

## Open data sources

- [Tax parcels with CAMA](https://meckgis.mecklenburgcountync.gov/server/rest/services/TaxParcel_camadata/MapServer) — PIN, address, land use, acres, assessed values, last CAMA sale
- [Tax Parcel Sales](https://meckgis.mecklenburgcountync.gov/server/rest/services/TaxParcelSales/FeatureServer) — recorded sales, grantor/grantee, `salesvalidity`
- [NCREC](https://www.ncrec.gov/) and [NC GS Chapter 93A](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_93A.html)

CAMA `zipcode` is often the **mailing** ZIP. Street and city filters are usually better for situs. Validity flags matter; related-party and quitclaim deeds still appear in the sales layer.

## Project layout

```text
app.py              Streamlit entry point
benchmark.py        Concurrent FastAPI /query latency harness
docs/architecture.jpg  FastAPI + cache + Vertex diagram
src/meck_agent/     UI, FastAPI, LangGraph agent, tools, ingest, RAG, Redis cache
data/sample/        Tiny CSVs + study notes so the app works offline
data/processed/     SQLite (gitignored)
data/chroma/        Vector index (gitignored)
tests/              Offline tests (hash embeddings, no paid APIs)
```

## Tests

```bash
pytest
```

Tests use bundled fixtures and hash embeddings. They do not call Groq, Gemini, Vertex, Redis-the-server, or county GIS.

## Out of scope

Paid MLS, POLARIS scraping, maps, auth, hosting, Kubernetes, full-county geometry, and anything you would ship to clients as advice.
