# AI/ML Influencer Credibility Auditor

End-to-end web application to detect fake followers and audit influencer credibility from grouped Instagram CSV datasets.

## Tech Stack

- **Backend:** FastAPI + pandas + numpy
- **Frontend:** React (Vite) + Tailwind CSS + Recharts
- **Data:** CSV upload (`multipart/form-data`)

## Folder Structure

```text
.
├── backend
│   ├── main.py
│   └── requirements.txt
├── data
│   └── sample_followers.csv
├── src
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
└── README.md
```

## Dataset Format (required)

CSV columns:

```text
influencer_name, category, insta_id, username, followers_count, following_count, avg_likes, avg_comments, total_posts, account_age_days, profile_complete
```

Grouping rule:
- First row of each `insta_id` group = influencer account row.
- Following rows in that group = follower rows to analyze.

## ML/Risk Pipeline

For each influencer group:

1. Skip first row (influencer), process follower rows only.
2. Engineer features:
   - `ratio = followers_count / (following_count + 1)`
   - `engagement_ratio = (avg_likes + avg_comments) / (followers_count + 1)`
   - `activity_rate = total_posts / (account_age_days + 1)`
3. Min-max normalization with epsilon.
4. Scores:
   - `ProfileScore = avg(1-ratio_norm, 1-age_norm, 1-profile_complete)`
   - `EngagementScore = 1-engagement_norm`
   - `TemporalScore = activity_norm`
5. Entropy weighting (`w_p`, `w_e`, `w_t`) and weighted risk score.
6. Class labels:
   - `< 0.4` → Genuine
   - `0.4 - 0.7` → Suspicious
   - `> 0.7` → Bot
7. Credibility:
   - `Credibility = (Ng + 0.5 × Ns) / N`

## API

### `POST /analyze`

Upload CSV file.

**Request:**
- Form field: `file`

**Response (array):**

```json
[
  {
    "influencer_name": "Ava Fitness",
    "category": "Health",
    "insta_id": "1001",
    "total_followers": 6,
    "genuine_count": 2,
    "suspicious_count": 2,
    "bot_count": 2,
    "credibility_score": 0.5,
    "status": "Fake influencer",
    "profile_contribution": 0.18,
    "engagement_contribution": 0.21,
    "temporal_contribution": 0.16,
    "reasons": ["Low engagement", "High bot percentage"]
  }
]
```

## Frontend Features

- CSV upload
- Calls backend `/analyze`
- Influencer audit table
- Search filter by influencer/category/insta_id
- Download summarized CSV report
- Visualizations:
  - Credibility gauge chart
  - Follower class pie chart
  - Explainability bar chart
- Explainability reasons panel

## Run Instructions

## 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 2) Frontend (Vite)

```bash
cd /workspace/new-work
npm install
npm run dev
```

Frontend expects backend at `http://localhost:8000` by default.

Optional override:

```bash
VITE_API_BASE=http://localhost:8000 npm run dev
```

## Performance Notes

- Backend returns only summarized influencer-level results.
- Vectorized pandas operations are used for follower scoring.
- Design supports large files (200,000+ rows) when sufficient memory is available.

## Sample Data

Use `data/sample_followers.csv` for local testing.
