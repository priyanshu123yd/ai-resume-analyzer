const button = document.getElementById("analyzeBtn");
const fileInput = document.getElementById("resumeFile");
const resultDiv = document.getElementById("result");

button.addEventListener("click", async function () {

    try {

        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a PDF first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        resultDiv.innerHTML = "<p>Analyzing resume...</p>";

        const response = await fetch("/upload-resume", {
            method: "POST",
            body: formData
        });

        const data = await response.json();


        console.log("API Response:", data);

        // Handle backend errors
        if (data.error) {
            resultDiv.innerHTML =
                "<h3>Error</h3><p>" + data.error + "</p>";
            return;
        }

        let cardColor = "#dc2626"; // Red

        if (data.resume_score >= 90) {
            cardColor = "#16a34a"; // Green
        }
        else if (data.resume_score >= 75) {
             cardColor = "#2563eb"; // Blue
        }
        else if (data.resume_score >= 60) {
            cardColor = "#ea580c"; // Orange
        }

        resultDiv.innerHTML = `

        <div class="score-card" style="background-color:${cardColor}; color:white;">
             <h2>${data.resume_score}/100</h2>
             <p><strong>${data.resume_level}</strong></p>
             <p><strong>ATS Score:</strong> ${data.ats_score}%</p>
        </div>

        <div class="section">
            <h3>Score Breakdown</h3>

            <div class="breakdown-card">

                <p>Skills: ${data.score_breakdown.skills}/20</p>

                <p>Projects: ${data.score_breakdown.projects}/25</p>

                <p>Experience: ${data.score_breakdown.experience}/25</p>

                <p>Certifications: ${data.score_breakdown.certifications}/10</p>

                <p>Resume Structure: ${data.score_breakdown.resume_structure}/20</p>

             </div>
        </div>
        <div class="section">

            <h3>Role Match Analysis</h3>

            <div class="breakdown-card">

                <p>📊 Data Analyst:
                ${data.role_match.data_analyst}%</p>

                <p>🐍 Python Developer:
                ${data.role_match.python_developer}%</p>

                <p>🤖 AI Engineer:
                ${data.role_match.ai_engineer}%</p>

            </div>

        </div>


        <div class="section">
            <h3>Skills</h3>

             <div class="skills-container">
                ${(data.skills || []).map(skill =>
                `<span class="skill-badge">${skill}</span>`
                ).join("")}
             </div>

        </div>

        <div class="section">
            <h3>Strengths</h3>
            <ul>
                ${(data.strengths || []).map(item =>
                 `<li>${item}</li>`
                 ).join("")}
            </ul>
        </div>

        <div class="section">
             <h3>Weaknesses</h3>
             <ul>
                  ${(data.weaknesses || []).map(item =>
                    `<li>${item}</li>`
                   ).join("")}
             </ul>
        </div>

        <div class="section">
             <h3>Suggestions</h3>
             <ul>
                ${(data.suggestions || []).map(item =>
                `<li>${item}</li>`
                 ).join("")}
             </ul>
        </div>

        `;
    } catch (error) {

        console.error(error);

        resultDiv.innerHTML =
            "<h3>Error</h3><p>" + error.message + "</p>";
    }
});