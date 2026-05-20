from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import predict

app = FastAPI(title="Fake News Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsInput(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Fake News Detector API is running"}

@app.post("/predict")
def predict_news(data: NewsInput):
    result = predict(data.text)
    return result