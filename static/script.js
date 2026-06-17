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

        resultDiv.innerHTML = `

        <div class="score-card">
             <h2>Resume Score: ${data.resume_score}</h2>
            <p><strong>Level:</strong> ${data.resume_level}</p>
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