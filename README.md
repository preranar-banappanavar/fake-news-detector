# 📰 Fake News Detector

An AI-powered web app that classifies news headlines or articles as **REAL** or **FAKE** using a machine-learning backend (TF-IDF + Logistic Regression) trained on a real, large-scale dataset.

---

## 🗂 Project Structure

```
fake-news-detector/
├── backend/
│   ├── main.py          # FastAPI server with /predict endpoint
│   ├── model.py         # Dataset loading, training, and inference
│   ├── requirements.txt # Python dependencies
│   └── model.pkl        # Auto-generated after first run
├── frontend/
│   ├── index.html       # App UI
│   ├── style.css        # Styles
│   └── script.js        # API calls & result rendering
└── README.md
```

---

## 📦 Dataset Options

The model auto-detects which dataset you have available (priority order):

### Option 1 — WELFake ✅ Recommended (72,134 articles)

Merged from Kaggle, McIntire, Reuters, and BuzzFeed Political datasets.

| Column | Description |
|--------|-------------|
| title  | Headline |
| text   | Article body |
| label  | **0** = Fake, **1** = Real |

**Download from any of:**
- Zenodo: https://zenodo.org/records/4561253 → `WELFake_Dataset.csv`
- Kaggle: https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification
- Hugging Face: https://huggingface.co/datasets/davanstrien/WELFake

Place `WELFake_Dataset.csv` inside `backend/`.

> **Auto-download:** If no CSV is found, `model.py` will attempt to download WELFake from Zenodo automatically (requires internet).

---

### Option 2 — ISOT (44,898 articles)

Real news from Reuters, fake news from various outlets.

Download from Kaggle: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset

Place both `True.csv` and `Fake.csv` inside `backend/`.

---

## 🚀 Quick Start

### 1 — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download dataset & train manually first:
python model.py

# Start the API server
uvicorn main:app --reload
```

`model.pkl` is created automatically. If no dataset CSV exists, the script tries to download WELFake from Zenodo.

### 2 — Frontend

Open `frontend/index.html` in your browser — no build step needed.

```bash
# Or serve with Python for cleaner CORS:
cd frontend && python -m http.server 5500
# Open http://localhost:5500
```

---

## 🔌 API Reference

### `POST /predict`

**Request**
```json
{ "text": "Your headline or article text here" }
```

**Response**
```json
{
  "label":      "FAKE",
  "confidence": 91.3,
  "conf_label": "High",
  "fake_prob":  91.3,
  "real_prob":   8.7
}
```

---

## 🧠 Model Details

| Component    | Details |
|--------------|---------|
| Vectorizer   | TF-IDF, up to 100k features, unigrams + bigrams, `sublinear_tf=True` |
| Classifier   | Logistic Regression (`C=5`, `lbfgs` solver) |
| Input        | Article title + body (concatenated) |
| Expected accuracy | ~98% on WELFake test split |
| Framework    | scikit-learn |
| API          | FastAPI + Uvicorn |

---

## ⚡ Tips

- Press **Ctrl + Enter** inside the text area to run analysis instantly.
- For better accuracy, paste full article text rather than just a headline.
- Retrain at any time: `python model.py` (will overwrite `model.pkl`).
