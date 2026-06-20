from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Request,
    Form
)
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
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):
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
          "suggestions": []
        }}

        Rules:
        - Return ONLY valid JSON
        - No markdown
        - No explanations
        - No code blocks
        - Count internships as experience
        - Extract technical skills only

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

        weaknesses = []

        if not has_experience:
            weaknesses.append(
                "No internship or professional experience found."
            )

        if projects < 3:
            weaknesses.append(
                "Resume contains fewer than 3 projects."
            )

        if certifications < 2:
            weaknesses.append(
                "Limited certifications."
            )

        if len(skills) < 8:
            weaknesses.append(
                "Skills section could be expanded."
            )

        parsed_json["weaknesses"] = weaknesses
        # ATS Score Calculation

        ats_score = 0

        # Skills (Max 30)
        ats_score += min(len(skills) * 2, 30)

        # Projects (Max 20)
        ats_score += min(projects * 7, 20)

        # Experience (Max 25)
        if has_experience:
            ats_score += 25

        # Certifications (Max 10)
        ats_score += min(certifications * 3, 10)

        # Resume Structure (Fixed)
        ats_score += 15

        ats_score = min(ats_score, 100)

        parsed_json["ats_score"] = ats_score

        print("ATS Score:", ats_score)

        # Role Match Analysis

        skills_lower = [skill.lower() for skill in skills]

        # Data Analyst

        data_analyst_keywords = [
            "python",
            "sql",
            "mysql",
            "powerbi",
            "excel"
        ]

        data_analyst_match = sum(
            1 for skill in data_analyst_keywords
            if skill in skills_lower
        )

        data_analyst_match = int(
            (data_analyst_match / len(data_analyst_keywords)) * 100
        )

        # Python Developer

        python_dev_keywords = [
            "python",
            "javascript",
            "html",
            "css",
            "git",
            "mysql"
        ]

        python_dev_match = sum(
            1 for skill in python_dev_keywords
            if skill in skills_lower
        )

        python_dev_match = int(
            (python_dev_match / len(python_dev_keywords)) * 100
        )

        # AI Engineer

        ai_keywords = [
            "python",
            "machine learning",
            "deep learning",
            "tensorflow",
            "pandas"
        ]

        ai_match = sum(
            1 for skill in ai_keywords
            if skill in skills_lower
        )

        ai_match = int(
            (ai_match / len(ai_keywords)) * 100
        )

        parsed_json["role_match"] = {
            "data_analyst": data_analyst_match,
            "python_developer": python_dev_match,
            "ai_engineer": ai_match
        }

        # -----------------------------------
        # Job Description Match Analysis
        # -----------------------------------

        job_match_score = 0
        matched_skills = []
        missing_skills = []

        if job_description.strip():

            jd_lower = job_description.lower()

            for skill in skills:

                if skill.lower() in jd_lower:
                    matched_skills.append(skill)

            common_keywords = [
                "python",
                "sql",
                "mysql",
                "power bi",
                "excel",
                "tableau",
                "statistics",
                "data analysis",
                "business analysis",
                "machine learning",
                "deep learning",
                "tensorflow",
                "pandas",
                "numpy",
                "html",
                "css",
                "javascript",
                "git",
                "github",
                "fastapi",
                "api",
                "dashboard",
                "data visualization"
            ]

            for keyword in common_keywords:

                if keyword in jd_lower:

                    found = False

                    for skill in skills:
                        if keyword == skill.lower():
                            found = True
                            break

                    if not found:
                        missing_skills.append(keyword)

            total_keywords = len(matched_skills) + len(missing_skills)

            if total_keywords > 0:
                job_match_score = int(
                    (len(matched_skills) / total_keywords) * 100
                )

        parsed_json["job_match"] = {
            "score": job_match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        }

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

@app.post("/improve-resume")
async def improve_resume(file: UploadFile = File(...)):

        try:

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(await file.read())
                temp_path = temp_file.name

            reader = PdfReader(temp_path)

            text = ""

            for page in reader.pages:
                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

            if not text.strip():
                return {
                    "error": "No text found in PDF."
                }

            prompt = f"""
    You are an ATS Resume Expert.

    Rewrite and improve this resume.

    Rules:
    - Improve summary
    - Improve project descriptions
    - Use strong action verbs
    - Make content ATS-friendly
    - Keep information truthful
    - Return plain text only

    Resume:

    {text}
    """

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            return {
                "improved_resume": response.text
            }

        except Exception as e:
            return {
                "error": str(e)
            }