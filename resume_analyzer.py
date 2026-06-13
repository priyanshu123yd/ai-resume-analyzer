from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from pypdf import PdfReader
from google import genai
from dotenv import load_dotenv

import tempfile
import os
import json

# Load environment variables
load_dotenv()

# Gemini Client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# FastAPI App
app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


# Home Page
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


# Resume Upload API
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:

        # Save uploaded PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        # Read PDF
        reader = PdfReader(temp_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        # Check if text extracted
        if not text.strip():
            return {
                "error": "No text found in PDF. The resume may be scanned or image-based."
            }

        print("PDF text extracted successfully")
        print("Characters extracted:", len(text))

        # Gemini Prompt
        prompt = f"""
        Analyze this resume and return ONLY valid JSON.

        Format:

        {{
          "skills": [],
          "projects_count": 0,
          "certifications_count": 0,
          "has_experience": false,
          "strengths": [],
          "weaknesses": [],
          "suggestions": []
        }}

        Rules:
        - Return ONLY valid JSON
        - No markdown
        - No explanations
        - No code blocks

        Resume:

        {text}
        """

        print("Calling Gemini API...")

        # Gemini API Call
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        print("Gemini API completed")

        result = response.text

        print("===== GEMINI RESPONSE =====")
        print(result)
        print("===========================")
        # Clean response
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

        # Convert JSON string to Python dictionary
        parsed_json = json.loads(result)

        # Extract values
        skills = parsed_json.get("skills", [])
        projects = parsed_json.get("projects_count", 0)
        certifications = parsed_json.get("certifications_count", 0)
        has_experience = parsed_json.get("has_experience", False)

        # -----------------------------------
        # Python Resume Scoring Engine
        # -----------------------------------

        # Skills Score (/20)
        skills_score = min(len(skills) * 2, 20)

        # Projects Score (/25)
        projects_score = min(projects * 8, 25)

        # Experience Score (/25)
        experience_score = 25 if has_experience else 10

        # Certifications Score (/10)
        certifications_score = min(certifications * 3, 10)

        # Resume Structure Score (/20)
        structure_score = 18

        # Final Score
        resume_score = (
            skills_score +
            projects_score +
            experience_score +
            certifications_score +
            structure_score
        )

        # Score Breakdown
        parsed_json["score_breakdown"] = {
            "skills": skills_score,
            "projects": projects_score,
            "experience": experience_score,
            "certifications": certifications_score,
            "resume_structure": structure_score
        }

        parsed_json["resume_score"] = resume_score

        # Resume Level
        if resume_score >= 90:
            level = "Excellent"
        elif resume_score >= 75:
            level = "Good"
        elif resume_score >= 60:
            level = "Average"
        else:
            level = "Needs Improvement"

        parsed_json["resume_level"] = level

        return parsed_json

    except Exception as e:
        return {
            "error": str(e)
        }