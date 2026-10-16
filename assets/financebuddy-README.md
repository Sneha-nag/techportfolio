# FinanceBuddy

A personal-finance **lakehouse** learning project — not a bank product. Synthetic users and transactions (with planted duplicate subscriptions and fraud-ish bursts) land as files, get cleaned with **dbt**, scored with a bit of **ML**, and show up in a **Streamlit** UI. The same repo can stay on a laptop (**DuckDB**) or talk to **S3 / Athena**. Optional pieces: **Kinesis → Firehose** streaming into the lake, and a **Bedrock Haiku** coach tab that only explains numbers already in the marts.

[Try out](https://financebuddy-tpvwauuuyscehgczyiapnt.streamlit.app/) · password `D3MOTRY@OUT`

[Code on GitHub](https://github.com/Sneha-nag/financebuddy)

![How FinanceBuddy moves data](assets/financebuddy-architecture.jpg)

## What you can do

1. Run the local pipeline (`generate → bronze → dbt → ML → gold`) and open Streamlit for a synthetic household.
2. Point the UI at **S3 gold Parquet** for a portfolio / live demo without scanning Athena on every click.
3. Optionally stream a few hundred events through Kinesis → Firehose into `raw/stream/`, then tear the stack down.
4. Optionally enable the AI Coach tab (Bedrock) with a capped JSON pack from the marts.

## Stack

| Piece | Role |
| --- | --- |
| Python generator | ~250 users × ~18 months of fake ledgers + ground truth |
| dbt (DuckDB or Athena) | Staging → intermediate → marts |
| Polars + scikit-learn | Subscriptions, habits, Isolation Forest fraud, suggestions |
| Streamlit | Demo UI with duckdb / s3 / athena backends |
| S3 + Glue + Athena | Cloud lakehouse twin of the local path |
| Kinesis + Firehose | Optional streaming lesson (teardown after demos) |
| Bedrock Claude Haiku | Optional coach; harness strips invented citations |

## Architecture

```text
generator → raw CSV / bronze Parquet
                ↓
         DuckDB + dbt  ──or──  S3 + Athena + dbt
                ↓
         ML scoring → gold marts / Parquet
                ↓
         Streamlit (local or Community Cloud on S3 gold)
                ↓ optional
         Bedrock Haiku coach
```

Batch (`scripts/run_pipeline.py`) is the main path. Streaming proves events can land in the lake without pretending the whole ML stack is real-time.

## Layout

```
financebuddy/
  config/              settings.yaml
  generator/           synthetic ledgers + planted events
  dbt_financebuddy/    SQL transforms (DuckDB or Athena target)
  ml/                  subscriptions, habits, fraud, suggestions, coach
  app/                 Streamlit UI + S3/Athena backends
  scripts/             pipeline, S3 upload, streaming setup/teardown
  docs/                architecture, AWS, live demo, coach, streaming
```

## Quick start

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements-pipeline.txt
python scripts/run_pipeline.py
streamlit run app/streamlit_app.py
```

For the cloud demo path, see [docs/live_demo.md](https://github.com/Sneha-nag/financebuddy/blob/main/docs/live_demo.md) in the repo (`FINANCEBUDDY_BACKEND=s3` + bucket + read-only IAM keys in Streamlit secrets).

## Cost note

Local path is free. On AWS, keep a small budget alert. Prefer S3 gold reads for the public UI. Delete Kinesis/Firehose after demos.
