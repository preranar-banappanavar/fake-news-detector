"""
model.py — Fake News Detector: data loading, training, and inference
=====================================================================

Dataset priority (auto-detected at train time):
  1. WELFake  — 72,134 articles (Zenodo / Kaggle / Hugging Face)
  2. ISOT     — 44,898 articles  (True.csv + Fake.csv, Kaggle)
  3. Auto-download WELFake from Zenodo  (requires internet access)

Quick-start
-----------
  # Option A — let the script download WELFake automatically:
  python model.py

  # Option B — place a CSV manually, then train:
  #   WELFake: put  WELFake_Dataset.csv   next to model.py
  #   ISOT   : put  True.csv + Fake.csv   next to model.py
  python model.py

Dataset sources
---------------
  WELFake : https://zenodo.org/records/4561253
            https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification
            https://huggingface.co/datasets/davanstrien/WELFake
  ISOT    : https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset
"""

import os
import sys
import pickle
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model.pkl"

WELFAKE_CSV  = BASE_DIR / "WELFake_Dataset.csv"
ISOT_REAL    = BASE_DIR / "True.csv"
ISOT_FAKE    = BASE_DIR / "Fake.csv"

# WELFake direct download (Zenodo record 4561253)
WELFAKE_URL  = "https://zenodo.org/records/4561253/files/WELFake_Dataset.csv?download=1"

# ── Download helper ─────────────────────────────────────────────────────────
def _download_welfake():
    """Try to download WELFake_Dataset.csv from Zenodo."""
    try:
        import requests
        log.info("Downloading WELFake dataset from Zenodo (~30 MB)…")
        r = requests.get(WELFAKE_URL, stream=True, timeout=120)
        r.raise_for_status()
        with open(WELFAKE_CSV, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        log.info(f"Saved to {WELFAKE_CSV}")
        return True
    except Exception as e:
        log.warning(f"Auto-download failed: {e}")
        return False

# ── Dataset loaders ─────────────────────────────────────────────────────────
def _load_welfake(path: Path) -> pd.DataFrame:
    """
    WELFake CSV columns: Unnamed: 0, title, text, label
    label: 0 = Fake, 1 = Real
    """
    log.info(f"Loading WELFake from {path}")
    df = pd.read_csv(path, low_memory=False)
    df = df.dropna(subset=["label"])
    # Invert labels because in this WELFake CSV, 0 = Real and 1 = Fake,
    # but the model pipeline expects 0 = Fake and 1 = Real.
    df["label"] = 1 - df["label"].astype(int)

    # Combine title + text for richer features
    title = df["title"].fillna("")
    text  = df["text"].fillna("")
    df["content"] = (title + " " + text).str.strip()
    df = df[df["content"].str.len() > 10]

    log.info(
        f"WELFake: {len(df):,} articles  "
        f"(real={int((df.label==1).sum()):,}, fake={int((df.label==0).sum()):,})"
    )
    return df[["content", "label"]]


def _load_isot(real_path: Path, fake_path: Path) -> pd.DataFrame:
    """
    ISOT columns: title, text, subject, date
    True.csv  → label 1 (Real)
    Fake.csv  → label 0 (Fake)
    """
    log.info("Loading ISOT dataset (True.csv + Fake.csv)")
    real = pd.read_csv(real_path)
    real["label"] = 1
    fake = pd.read_csv(fake_path)
    fake["label"] = 0

    df = pd.concat([real, fake], ignore_index=True)
    title = df.get("title", pd.Series([""] * len(df))).fillna("")
    text  = df.get("text",  pd.Series([""] * len(df))).fillna("")
    df["content"] = (title + " " + text).str.strip()
    df = df[df["content"].str.len() > 10]

    log.info(
        f"ISOT: {len(df):,} articles  "
        f"(real={int((df.label==1).sum()):,}, fake={int((df.label==0).sum()):,})"
    )
    return df[["content", "label"]]


def _get_dataframe() -> pd.DataFrame:
    """Return a labelled DataFrame from the best available source."""
    # 1. WELFake already on disk
    if WELFAKE_CSV.exists():
        return _load_welfake(WELFAKE_CSV)

    # 2. ISOT already on disk
    if ISOT_REAL.exists() and ISOT_FAKE.exists():
        return _load_isot(ISOT_REAL, ISOT_FAKE)

    # 3. Try auto-downloading WELFake
    log.info("No local dataset found. Attempting auto-download of WELFake…")
    if _download_welfake():
        return _load_welfake(WELFAKE_CSV)

    # 4. Hard fail with clear instructions
    log.error(
        "\n"
        "═══════════════════════════════════════════════════════════════\n"
        " No dataset found. Please add one of the following:\n\n"
        "  WELFake  (recommended, ~72 k articles):\n"
        "    https://zenodo.org/records/4561253\n"
        "    → place  WELFake_Dataset.csv  next to model.py\n\n"
        "  ISOT  (~44 k articles):\n"
        "    https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset\n"
        "    → place  True.csv  and  Fake.csv  next to model.py\n"
        "═══════════════════════════════════════════════════════════════"
    )
    sys.exit(1)


# ── Build pipeline ──────────────────────────────────────────────────────────
def _build_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=10_000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
            stop_words="english",
        )),
        ("clf", LogisticRegression(
            C=5.0,
            max_iter=1000,
            solver="lbfgs",
            n_jobs=-1,
            random_state=42,
        )),
    ])


# ── Train ───────────────────────────────────────────────────────────────────
def train_model(sample_size: int | None = None) -> Pipeline:
    """
    Train on the best available dataset and persist model.pkl.

    Args:
        sample_size: If set, train on a random subset of this size
                     (useful for quick tests). None = use full dataset.
    """
    df = _get_dataframe()

    if sample_size:
        df = df.sample(min(sample_size, len(df)), random_state=42)
        log.info(f"Using random sample of {len(df):,} rows")

    X = df["content"].tolist()
    y = df["label"].tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, random_state=42, stratify=y
    )
    log.info(f"Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    pipeline = _build_pipeline()
    log.info("Training TF-IDF + Logistic Regression…")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    log.info(f"Test accuracy: {acc:.4f}")
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=["Fake", "Real"]))

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    log.info(f"Model saved → {MODEL_PATH}")
    return pipeline


# ── Load ────────────────────────────────────────────────────────────────────
def load_model() -> Pipeline:
    """Load model.pkl from disk; train it first if it doesn't exist."""
    if not MODEL_PATH.exists():
        log.info("model.pkl not found – training now…")
        return train_model()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


# ── Inference ───────────────────────────────────────────────────────────────
# Loaded once at import time for fast API responses - v2.2
_model: Pipeline = load_model()


def predict(text: str) -> dict:
    """
    Classify a news headline or article body.

    Returns:
        {
          "label":      "REAL" | "FAKE",
          "confidence": float (0-100),
          "conf_label": "High" | "Medium" | "Low",
          "fake_prob":  float,
          "real_prob":  float,
        }
    """
    proba = _model.predict_proba([text])[0]   # [P(fake), P(real)]
    label = int(_model.predict([text])[0])    # 0 = fake, 1 = real

    fake_pct  = round(float(proba[0]) * 100, 1)
    real_pct  = round(float(proba[1]) * 100, 1)
    confidence = max(fake_pct, real_pct)

    conf_label = "High" if confidence >= 80 else "Medium" if confidence >= 60 else "Low"

    return {
        "label":      "REAL" if label == 1 else "FAKE",
        "confidence": confidence,
        "conf_label": conf_label,
        "fake_prob":  fake_pct,
        "real_prob":  real_pct,
    }


# ── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Re-train (forces a fresh download + fit even if model.pkl exists)
    train_model()

    tests = [
        "Scientists develop mRNA vaccine showing 94% efficacy against new variant",
        "SHOCKING: Government putting microchips in COVID vaccines – share before deleted!",
        "Federal Reserve holds interest rates steady amid inflation concerns",
        "BOMBSHELL: Celebrities running secret underground tunnels beneath major cities",
    ]
    print("\n── Sample predictions ──────────────────────────────")
    for t in tests:
        r = predict(t)
        print(f"[{r['label']:4s} {r['confidence']:5.1f}%] {t[:80]}")