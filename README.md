# Voice of Consumer OS

Voice of Consumer OS turns real user comments from Douyin, Xiaohongshu, Bilibili,
and other social platforms into executable brand content strategy.

The current runnable implementation is in `fullstack/`.

## What It Does

- Imports comments from CSV, JSON, or pasted text.
- Stores comments, brand data, benchmark data, strategies, reports, and reviews in SQLite.
- Runs a 10-step Agent pipeline for comment analysis, demand mapping, barrier analysis,
  competitor opportunities, platform strategy, experiments, decisions, and reviews.
- Provides 14 product modules across decision, insight, strategy, execution, asset, and AI engine views.
- Supports DeepSeek, OpenAI, or custom OpenAI-compatible providers through server-side settings.
- Can run publicly through Cloudflare Tunnel at `vocos.meetmore.cc`.

## Structure

```text
.
|-- fullstack/
|   |-- app.py
|   |-- public/
|   |-- scripts/
|   |-- deploy/
|   |-- .env.example
|   `-- README.md
|-- sample_comments.csv
|-- sample_comments.json
|-- overview.md
`-- README.md
```

Runtime secrets and data are intentionally not committed:

- `fullstack/.env`
- `fullstack/data/`
- database files
- logs
- Cloudflare credentials and private keys

## Run Locally

```powershell
cd fullstack
$env:VOC_PORT="8090"
python app.py
```

Open `http://127.0.0.1:8090`.

For the exact Windows runtime path and public tunnel setup, see `fullstack/README.md`.
