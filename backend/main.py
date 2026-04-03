from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

EPSILON = 1e-9
EXPECTED_COLUMNS = {
    "influencer_name",
    "category",
    "insta_id",
    "username",
    "followers_count",
    "following_count",
    "avg_likes",
    "avg_comments",
    "total_posts",
    "account_age_days",
    "profile_complete",
}


@dataclass
class InfluencerResult:
    influencer_name: str
    category: str
    insta_id: str
    total_followers: int
    genuine_count: int
    suspicious_count: int
    bot_count: int
    credibility_score: float
    status: str
    profile_contribution: float
    engagement_contribution: float
    temporal_contribution: float
    reasons: List[str]


app = FastAPI(title="Influencer Credibility Auditor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def minmax(series: pd.Series) -> pd.Series:
    min_v = float(series.min())
    max_v = float(series.max())
    return (series - min_v) / (max_v - min_v + EPSILON)


def entropy_weights(matrix: np.ndarray) -> np.ndarray:
    """Compute entropy weights for columns in matrix."""
    n_samples = matrix.shape[0]
    if n_samples == 0:
        return np.array([1 / 3, 1 / 3, 1 / 3])

    col_sum = matrix.sum(axis=0, keepdims=True) + EPSILON
    p = matrix / col_sum
    p = np.clip(p, EPSILON, 1)

    k = 1.0 / np.log(n_samples + EPSILON)
    entropy = -k * np.sum(p * np.log(p), axis=0)
    divergence = 1 - entropy
    if np.isclose(divergence.sum(), 0):
        return np.array([1 / matrix.shape[1]] * matrix.shape[1])
    return divergence / divergence.sum()


def follower_risk_pipeline(followers: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, float]]:
    followers = followers.copy()

    followers["ratio"] = followers["followers_count"] / (followers["following_count"] + 1)
    followers["engagement_ratio"] = (
        followers["avg_likes"] + followers["avg_comments"]
    ) / (followers["followers_count"] + 1)
    followers["activity_rate"] = followers["total_posts"] / (followers["account_age_days"] + 1)

    followers["ratio_norm"] = minmax(followers["ratio"])
    followers["engagement_norm"] = minmax(followers["engagement_ratio"])
    followers["activity_norm"] = minmax(followers["activity_rate"])
    followers["age_norm"] = minmax(followers["account_age_days"])

    followers["profile_complete"] = followers["profile_complete"].fillna(0).astype(float)
    followers["profile_complete"] = followers["profile_complete"].clip(0, 1)

    followers["ProfileScore"] = (
        (1 - followers["ratio_norm"]) + (1 - followers["age_norm"]) + (1 - followers["profile_complete"])
    ) / 3
    followers["EngagementScore"] = 1 - followers["engagement_norm"]
    followers["TemporalScore"] = followers["activity_norm"]

    score_matrix = followers[["ProfileScore", "EngagementScore", "TemporalScore"]].to_numpy()
    weights = entropy_weights(score_matrix)

    followers["RiskScore"] = (
        weights[0] * followers["ProfileScore"]
        + weights[1] * followers["EngagementScore"]
        + weights[2] * followers["TemporalScore"]
    )

    bins = [-np.inf, 0.4, 0.7, np.inf]
    labels = ["Genuine", "Suspicious", "Bot"]
    followers["risk_class"] = pd.cut(followers["RiskScore"], bins=bins, labels=labels, right=False)
    followers["risk_class"] = followers["risk_class"].astype(str)

    contribution = {
        "profile": float(weights[0] * followers["ProfileScore"].mean()),
        "engagement": float(weights[1] * followers["EngagementScore"].mean()),
        "temporal": float(weights[2] * followers["TemporalScore"].mean()),
    }
    return followers, contribution


def generate_reasons(bot_ratio: float, suspicious_ratio: float, avg_engagement_score: float, avg_profile_score: float) -> List[str]:
    reasons: List[str] = []
    if avg_engagement_score > 0.6:
        reasons.append("Low engagement")
    if bot_ratio > 0.25:
        reasons.append("High bot percentage")
    if avg_profile_score > 0.55:
        reasons.append("Poor follower ratio/profile quality")
    if suspicious_ratio > 0.35:
        reasons.append("Large suspicious follower cluster")
    if not reasons:
        reasons.append("Follower distribution appears healthy")
    return reasons


def process_dataframe(df: pd.DataFrame) -> List[InfluencerResult]:
    required_missing = EXPECTED_COLUMNS - set(df.columns)
    if required_missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {sorted(required_missing)}")

    numeric_cols = [
        "followers_count",
        "following_count",
        "avg_likes",
        "avg_comments",
        "total_posts",
        "account_age_days",
        "profile_complete",
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    results: List[InfluencerResult] = []

    for insta_id, group in df.groupby("insta_id", sort=False):
        group = group.reset_index(drop=True)
        if group.empty:
            continue

        influencer_row = group.iloc[0]
        followers = group.iloc[1:].copy()

        if followers.empty:
            continue

        followers, contribution = follower_risk_pipeline(followers)

        total = int(len(followers))
        genuine_count = int((followers["risk_class"] == "Genuine").sum())
        suspicious_count = int((followers["risk_class"] == "Suspicious").sum())
        bot_count = int((followers["risk_class"] == "Bot").sum())

        credibility = (genuine_count + 0.5 * suspicious_count) / max(total, 1)
        status = "Genuine influencer" if credibility >= 0.65 else "Fake influencer"

        reasons = generate_reasons(
            bot_ratio=bot_count / total,
            suspicious_ratio=suspicious_count / total,
            avg_engagement_score=float(followers["EngagementScore"].mean()),
            avg_profile_score=float(followers["ProfileScore"].mean()),
        )

        results.append(
            InfluencerResult(
                influencer_name=str(influencer_row["influencer_name"]),
                category=str(influencer_row["category"]),
                insta_id=str(insta_id),
                total_followers=total,
                genuine_count=genuine_count,
                suspicious_count=suspicious_count,
                bot_count=bot_count,
                credibility_score=round(float(credibility), 4),
                status=status,
                profile_contribution=round(contribution["profile"], 4),
                engagement_contribution=round(contribution["engagement"], 4),
                temporal_contribution=round(contribution["temporal"], 4),
                reasons=reasons,
            )
        )

    return results


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

    results = process_dataframe(df)
    return [result.__dict__ for result in results]
