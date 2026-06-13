# AI Resume Analyzer

A FastAPI-based Resume Analyzer powered by Google Gemini.

## Features

- Upload PDF resumes
- Extract text using pypdf
- Analyze resume using Gemini AI
- Generate:
  - Resume Score
  - Score Breakdown
  - Skills
  - Strengths
  - Weaknesses
  - Suggestions
  - Resume Level

## Installation

pip install -r requirements.txt

Create a .env file:

GEMINI_API_KEY=YOUR_API_KEY

Run:

uvicorn resume_analyzer:app --reload

Open:

http://127.0.0.1:8000/docs

## Home Page

![Home Page](screenshots/home-page.png)

## Resume Analysis

![Resume Analysis](screenshots/analyze.png)