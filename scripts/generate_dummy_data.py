"""Generate sample Instagram follower-quality dataset (stdlib only)."""

from pathlib import Path
import csv
import random


def generate_row(i: int) -> dict:
    followers = random.randint(500, 50000)
    following = random.randint(100, 20000)
    avg_likes = random.randint(5, 1500)
    avg_comments = random.randint(0, 200)
    total_posts = random.randint(5, 1500)
    account_age_days = random.randint(30, 3650)
    profile_complete = 1 if random.random() > 0.3 else 0

    engagement_ratio = (avg_likes + avg_comments) / (followers + 1)
    ratio = followers / (following + 1)
    bot_like = engagement_ratio < 0.015 or ratio < 0.8 or profile_complete == 0

    return {
        "user_id": f"u{i:03d}",
        "username": f"user_{i:03d}",
        "followers_count": followers,
        "following_count": following,
        "avg_likes": avg_likes,
        "avg_comments": avg_comments,
        "total_posts": total_posts,
        "account_age_days": account_age_days,
        "profile_complete": profile_complete,
        "ground_truth": "Bot" if bot_like else "Genuine",
    }


if __name__ == "__main__":
    random.seed(42)
    out_path = Path("datasets/instagram_dataset_50_records.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    rows = [generate_row(i) for i in range(1, 51)]
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated dataset at {out_path}")
