"""End-to-end fake follower detection pipeline.

This module implements:
- preprocessing (missing values + IQR outlier clipping)
- feature engineering
- min-max normalization
- entropy-based weighting
- risk scoring + labeling
- evaluation metrics (if ground_truth is available)
- influencer credibility score
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

EPSILON = 1e-9
REQUIRED_COLUMNS = [
    "followers_count",
    "following_count",
    "avg_likes",
    "avg_comments",
    "total_posts",
    "account_age_days",
    "profile_complete",
]


@dataclass
class PipelineArtifacts:
    data: pd.DataFrame
    weights: Dict[str, float]
    credibility: float
    metrics: Dict[str, float]


def _validate_columns(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values and clip outliers with IQR."""
    cleaned = df.copy()
    _validate_columns(cleaned)

    for col in REQUIRED_COLUMNS:
        cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")
        cleaned[col] = cleaned[col].fillna(cleaned[col].median())

    cleaned["profile_complete"] = cleaned["profile_complete"].clip(0, 1)

    numeric_cols = [c for c in REQUIRED_COLUMNS if c != "profile_complete"]
    for col in numeric_cols:
        q1 = cleaned[col].quantile(0.25)
        q3 = cleaned[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        cleaned[col] = cleaned[col].clip(lower, upper)

    return cleaned


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    featured = df.copy()
    featured["ratio"] = featured["followers_count"] / (featured["following_count"] + 1)
    featured["engagement_ratio"] = (featured["avg_likes"] + featured["avg_comments"]) / (
        featured["followers_count"] + 1
    )
    featured["activity_rate"] = featured["total_posts"] / (featured["account_age_days"] + 1)
    return featured


def minmax_normalize(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    normalized = df.copy()
    for col in cols:
        x_min = normalized[col].min()
        x_max = normalized[col].max()
        normalized[f"norm_{col}"] = (normalized[col] - x_min) / (x_max - x_min + EPSILON)
        normalized[f"norm_{col}"] = normalized[f"norm_{col}"].clip(0, 1)
    return normalized


def compute_scores(df: pd.DataFrame) -> pd.DataFrame:
    scored = df.copy()
    scored["ratio_risk"] = 1 - scored["norm_ratio"]
    scored["age_risk"] = 1 - scored["norm_account_age_days"]
    scored["profile_risk"] = 1 - scored["profile_complete"]
    scored["ProfileScore"] = (
        scored["ratio_risk"] + scored["age_risk"] + scored["profile_risk"]
    ) / 3

    scored["EngagementScore"] = 1 - scored["norm_engagement_ratio"]
    scored["TemporalScore"] = scored["norm_activity_rate"]
    return scored


def entropy_weights(df: pd.DataFrame) -> Dict[str, float]:
    score_cols = ["ProfileScore", "EngagementScore", "TemporalScore"]
    values = df[score_cols].to_numpy(dtype=float)
    n = values.shape[0]
    k = 1 / np.log(max(2, n))

    col_sums = values.sum(axis=0) + EPSILON
    p = values / col_sums
    p = np.clip(p, EPSILON, 1.0)

    entropy = -k * np.sum(p * np.log(p), axis=0)
    d = 1 - entropy
    weights = d / (d.sum() + EPSILON)

    return {
        "w_p": float(weights[0]),
        "w_e": float(weights[1]),
        "w_t": float(weights[2]),
    }


def score_and_classify(df: pd.DataFrame, weights: Dict[str, float]) -> pd.DataFrame:
    scored = df.copy()
    scored["RiskScore"] = (
        weights["w_p"] * scored["ProfileScore"]
        + weights["w_e"] * scored["EngagementScore"]
        + weights["w_t"] * scored["TemporalScore"]
    )

    def label_fn(x: float) -> str:
        if x < 0.4:
            return "Genuine"
        if x <= 0.7:
            return "Suspicious"
        return "Bot"

    scored["Label"] = scored["RiskScore"].apply(label_fn)
    return scored


def compute_credibility(df: pd.DataFrame) -> float:
    n = len(df)
    ng = (df["Label"] == "Genuine").sum()
    ns = (df["Label"] == "Suspicious").sum()
    return float((ng + 0.5 * ns) / max(1, n))


def evaluate(df: pd.DataFrame) -> Dict[str, float]:
    """Compute Accuracy/F1 if ground_truth is present; return empty dict otherwise."""
    if "ground_truth" not in df.columns:
        return {}

    y_true = (df["ground_truth"].astype(str).str.lower() == "bot").astype(int)
    y_pred = (df["Label"].astype(str).str.lower() == "bot").astype(int)

    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())

    accuracy = (tp + tn) / max(1, len(df))
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    f1 = (2 * precision * recall) / max(EPSILON, (precision + recall))

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
    }


def build_visualizations(df: pd.DataFrame, credibility: float, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    label_counts = df["Label"].value_counts().reindex(["Genuine", "Suspicious", "Bot"]).fillna(0)

    plt.figure(figsize=(7, 4))
    label_counts.plot(kind="bar", color=["#22C55E", "#FACC15", "#EF4444"])
    plt.title("Follower Classification Counts")
    plt.ylabel("Accounts")
    plt.tight_layout()
    plt.savefig(output_dir / "label_counts_bar.png", dpi=150)
    plt.close()

    plt.figure(figsize=(6, 6))
    plt.pie(label_counts.values, labels=label_counts.index, autopct="%1.1f%%", colors=["#22C55E", "#FACC15", "#EF4444"])
    plt.title("Label Distribution")
    plt.tight_layout()
    plt.savefig(output_dir / "label_distribution_pie.png", dpi=150)
    plt.close()

    plt.figure(figsize=(5, 4))
    plt.bar(["Credibility"], [credibility], color="#3B82F6")
    plt.ylim(0, 1)
    plt.title("Influencer Credibility Score")
    plt.tight_layout()
    plt.savefig(output_dir / "credibility_score.png", dpi=150)
    plt.close()


def run_pipeline(csv_path: Path, output_dir: Path) -> PipelineArtifacts:
    df = pd.read_csv(csv_path)
    cleaned = preprocess_data(df)
    featured = engineer_features(cleaned)
    normalized = minmax_normalize(featured, ["ratio", "engagement_ratio", "activity_rate", "account_age_days"])
    scored = compute_scores(normalized)
    weights = entropy_weights(scored)
    final_df = score_and_classify(scored, weights)
    credibility = compute_credibility(final_df)
    metrics = evaluate(final_df)

    build_visualizations(final_df, credibility, output_dir)
    final_df.to_csv(output_dir / "scored_output.csv", index=False)

    return PipelineArtifacts(data=final_df, weights=weights, credibility=credibility, metrics=metrics)


if __name__ == "__main__":
    artifacts = run_pipeline(Path("datasets/instagram_dataset_50_records.csv"), Path("outputs"))
    print("Entropy weights:", artifacts.weights)
    print("Credibility:", round(artifacts.credibility, 4))
    if artifacts.metrics:
        print("Metrics:", artifacts.metrics)
    print("Saved outputs to ./outputs")
