from fastapi import FastAPI, UploadFile, File
from pypdf import PdfReader
import tempfile
from google import genai
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

app = FastAPI()


@app.get("/")
def home():
    return {"message": "PDF Resume Analyzer Running"}


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    try:
        # Save uploaded PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        # Extract text from PDF
        reader = PdfReader(temp_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        # Check if text was extracted
        if not text.strip():
            return {
                "error": "No text found in PDF. The resume may be scanned or image-based."
            }

        # Prompt Engineering
        prompt = f"""
        Analyze this resume and return ONLY valid JSON.

        Format:

        {{
          "resume_score": 0,
          "score_breakdown": {{
            "skills": 0,
            "projects": 0,
            "experience": 0,
            "certifications": 0,
            "resume_structure": 0
          }},
          "skills": [],
          "strengths": [],
          "weaknesses": [],
          "suggestions": []
        }}

        Scoring Rules:

        - Skills: /20
        - Projects: /25
        - Experience: /25
        - Certifications: /10
        - Resume Structure & Formatting: /20

        Total score must be out of 100.

        IMPORTANT:
        - Return ONLY valid JSON
        - No markdown
        - No explanations outside JSON

        Resume:

        {text}
        """
        print("PDF text extracted successfully")
        print("Characters extracted:", len(text))
        # Gemini API Call
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        result = response.text

        print("===== GEMINI RESPONSE =====")
        print(result)
        print("===========================")
        # Clean Gemini response
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

        # Convert JSON string to Python dictionary
        parsed_json = json.loads(result)

        # Add Resume Level
        score = parsed_json["resume_score"]

        if score >= 90:
            level = "Excellent"
        elif score >= 75:
            level = "Good"
        elif score >= 60:
            level = "Average"
        else:
            level = "Needs Improvement"

        parsed_json["resume_level"] = level

        return parsed_json
    except Exception as e:
        return {
            "error": str(e)
        }