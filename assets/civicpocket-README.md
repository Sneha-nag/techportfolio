# CivicPocket

CivicPocket helps residents, small business owners, and students find public financial assistance, local grants, and subsidies they already qualify for. The first three questions stay local and fast. An optional Vertex AI assistant can reason through a more specific situation. Anonymous usage events feed a utilization dashboard.

Focus geography: **Mecklenburg County and North Carolina**, plus federal programs that apply anywhere in the U.S.

## What you get

1. **3-question eligibility wizard** — location, income bracket, assistance category.
2. **Direct resource directory** — eligibility summary, deadline, apply link. No marketing copy.
3. **Agentic assistant** — Vertex AI on Google Cloud when configured; a local matcher otherwise.
4. **Aggregate utilization reporting** — anonymous match and apply events in BigQuery, or a local file if BigQuery is not set up.

## Privacy

- Wizard answers never include name, SSN, address, or contact information.
- Analytics store only region, income bracket, category, and event type.
- `PRIVACY_DISABLE_MODEL_TRAINING=true` is required. Customer prompts are not used to train Google foundation models on Vertex AI.
- User text is stripped of common PII patterns before any model call.
- See [frontend privacy page](frontend/app/privacy/page.tsx) and `.cursor/rules/privacy.mdc`.

## Project layout

```
civicpocket/
  LICENSE                 All rights reserved
  frontend/               Next.js (App Router) UI
  backend/                FastAPI + matcher + Vertex AI + analytics
  backend/data/programs.json
```

## Step-by-step setup

### 1. Prerequisites

- Node.js 20+
- Python 3.11+
- Git (this folder already has `git init`)

Optional, only if you want live Gemini and BigQuery:

- A Google Cloud project with Vertex AI enabled
- Application Default Credentials (`gcloud auth application-default login`)
- A BigQuery dataset (the API can create the table)

The app runs fully without Google Cloud. Matching and the assistant use the local catalog.

### 2. Environment files

From the project root:

```powershell
copy .env.example .env
copy .env.example frontend\.env.local
```

Edit `.env` if you have GCP credentials. Leave Google fields empty for local-only mode.

### 3. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 4. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

### 5. Optional Vertex AI

1. Enable the Vertex AI API on your GCP project.
2. Set `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION=us-east1` in `.env`.
3. Confirm `GOOGLE_GENAI_USE_VERTEXAI=true` and `PRIVACY_DISABLE_MODEL_TRAINING=true`.
4. In GCP, keep generative AI data logging disabled for the project/org.

### 6. BigQuery (on; needs a GCP project)

`BIGQUERY_ENABLED=true` is the default. Set `GOOGLE_CLOUD_PROJECT` and Application Default Credentials. On API startup CivicPocket creates dataset `civicpocket_analytics` plus:

- `utilization_events` — anonymous region / income bracket / category events
- `grant_snapshots` — daily remaining federal award balances (award − outlays)

If the project is empty or BigQuery is unreachable, the same rows go to local JSONL files. Insights also writes a grant snapshot each time it loads (once per award per day). You can trigger a snapshot with `POST /api/snapshots/grants`.

### 7. Operator MCP server

Cursor can call CivicPocket tools from `.cursor/mcp.json`:

- `warehouse_health` / `warehouse_info`
- `get_insights`
- `run_usage_query` (allowlisted names only — no free-form SQL)
- `snapshot_grants_now`

Reload MCP in Cursor after starting the backend virtualenv. Tools never return names, SSNs, or addresses.

## Government APIs

Matching and insights call public government APIs that apply to North Carolina residents. No CivicPocket API keys are required.

| API | What CivicPocket uses |
|---|---|
| [Grants.gov](https://api.grants.gov/v1/api/search2) `search2` | Live federal opportunities (small business, housing, energy, education, workforce) |
| [NC OSBM LINC](https://ncosbm.opendatasoft.com/) | Official county caseloads (SNAP/food stamps, Work First, Medicaid) |
| [USAspending.gov](https://api.usaspending.gov/) | Federal dollars by North Carolina county, plus remaining grant balances (award − outlays) for awards still open today |

If an API is unreachable, the local program catalog still returns matches.

## Copyright

Copyright (c) 2026 Snehalatha Nagabhairava. All rights reserved. See `LICENSE`.
