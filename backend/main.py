from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from model import predict
import os

# Turbit API entrypoint - v2.2
app = FastAPI(title="Fake News Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsInput(BaseModel):
    text: str

@app.post("/predict")
def predict_news(data: NewsInput):
    result = predict(data.text)
    return result

# Serve static frontend files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")