# Fake Instagram Follower Detection & Influencer Credibility

This project includes:

1. **React dashboard** for interactive inspection of follower-risk results.
2. **Python ML-style pipeline** (`ml/pipeline.py`) implementing preprocessing, feature engineering, entropy-based weighting, risk scoring, labeling, metrics, and credibility visualization.

## Dataset schema

Required columns:

- `followers_count`
- `following_count`
- `avg_likes`
- `avg_comments`
- `total_posts`
- `account_age_days`
- `profile_complete`

Optional:

- `ground_truth` (used to compute accuracy / precision / recall / F1).

A sample dataset is available at `datasets/instagram_dataset_50_records.csv`.

## Python pipeline

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run pipeline

```bash
python -m ml.pipeline
```

Outputs are written to `outputs/`:

- `scored_output.csv`
- `label_counts_bar.png`
- `label_distribution_pie.png`
- `credibility_score.png`

## Frontend

```bash
npm install
npm run dev
```

The UI now includes:

- Detection results table with `RiskScore` and labels (`Genuine`, `Suspicious`, `Bot`)
- **Performance metrics** (Accuracy, F1, Precision, Recall)
- **Final influencer credibility visualization**
- Updated algorithm overview aligned with entropy-based scoring
- Feature Signals module removed

## Formula summary

- `ratio = followers / (following + 1)`
- `engagement_ratio = (avg_likes + avg_comments) / (followers + 1)`
- `activity_rate = total_posts / (account_age_days + 1)`

Min-max normalization:

- `x' = (x - xmin) / (xmax - xmin + epsilon)`

Scores:

- `ProfileScore = mean(1 - norm_ratio, 1 - norm_account_age, 1 - profile_complete)`
- `EngagementScore = 1 - norm_engagement_ratio`
- `TemporalScore = norm_activity_rate`

Entropy weights:

- `E = -k * sum(p * log(p))`, where `k = 1 / log(n)`
- `D = 1 - E`
- `W = D / sum(D)`

Final risk score:

- `RiskScore = wp*ProfileScore + we*EngagementScore + wt*TemporalScore`

Classification:

- `< 0.4` → Genuine
- `0.4–0.7` → Suspicious
- `> 0.7` → Bot

Credibility:

- `Credibility = (Ng + 0.5 * Ns) / N`
