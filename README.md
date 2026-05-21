# Fake News Detector

An AI-powered web app that classifies news headlines and articles as **REAL** or **FAKE** using a TF-IDF + Logistic Regression model trained on 72,000+ real-world articles.

---

## Project Structure

```
fake-news-detector/
├── backend/
│   ├── main.py           # FastAPI server — exposes /predict endpoint
│   ├── model.py          # Dataset loading, training, and inference
│   ├── requirements.txt  # Python dependencies
│   └── model.pkl         # Generated automatically on first run
├── frontend/
│   ├── index.html        # UI
│   ├── style.css         # Styles
│   └── script.js         # Calls the API and renders results
└── README.md
```

---

## Getting Started

### 1. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Add a dataset

The model needs a dataset CSV before it can train. Place one of the following inside `backend/`:

| Dataset | Size | File(s) needed | Download |
|---------|------|----------------|----------|
| **WELFake** (recommended) | 72,134 articles | `WELFake_Dataset.csv` | [Zenodo](https://zenodo.org/records/4561253) · [Kaggle](https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification) · [Hugging Face](https://huggingface.co/datasets/davanstrien/WELFake) |
| **ISOT** | 44,898 articles | `True.csv` + `Fake.csv` | [Kaggle](https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset) |

> If no CSV is found, `model.py` will attempt to **auto-download WELFake from Zenodo** (requires internet access).

### 3. Train the model

```bash
python model.py
```

This downloads the dataset (if needed), trains the model, prints a classification report, and saves `model.pkl`. Takes 1–3 minutes on a standard laptop.

### 4. Start the API server

```bash
uvicorn main:app --reload
```

Server runs at `http://127.0.0.1:8000`. On first launch, if `model.pkl` doesn't exist yet, training runs automatically.

### 5. Open the frontend

Open `frontend/index.html` directly in your browser. If you run into CORS issues, serve it locally instead:

```bash
cd frontend
python -m http.server 5500
# Open http://localhost:5500
```

---

## API

### `POST /predict`

**Request body**
```json
{ "text": "Paste a headline or article here" }
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

`label` is either `"REAL"` or `"FAKE"`. `conf_label` is `"High"` (≥80%), `"Medium"` (≥60%), or `"Low"`.

---

## Model

| | |
|--|--|
| Vectorizer | TF-IDF · 100k features · unigrams + bigrams · `sublinear_tf=True` |
| Classifier | Logistic Regression · `C=5` · `lbfgs` solver |
| Input | Article title + body concatenated |
| Accuracy | ~98% on WELFake 10% test split |
| Stack | scikit-learn · FastAPI · Uvicorn |

---

## Notes

- Paste full article text for best results — headlines alone are less reliable.
- Press **Ctrl + Enter** in the text box to submit without clicking.
- To retrain from scratch: `python model.py` (overwrites `model.pkl`).
- This is a demonstration project. Always verify news with primary sources.
