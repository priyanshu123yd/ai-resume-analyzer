const button = document.getElementById("analyzeBtn");
const fileInput = document.getElementById("resumeFile");
const resultDiv = document.getElementById("result");
const improveBtn = document.getElementById("improveBtn");
const improvedResumeDiv = document.getElementById("improvedResume");
const downloadBtn =
document.getElementById("downloadBtn");
const loadingBox =
    document.getElementById("loadingBox");

const loadingText =
    document.getElementById("loadingText");

button.addEventListener("click", async function () {

    try {

        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a PDF first!");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        formData.append(
            "job_description",
            document.getElementById("jobDescription").value
        );

        loadingBox.style.display = "block";

        resultDiv.innerHTML = "";

        const loadingMessages = [
            "Extracting resume content...",
            "Analyzing skills...",
            "Calculating ATS score...",
            "Matching job description...",
            "Generating recommendations..."
        ];

        let messageIndex = 0;

        const loadingInterval = setInterval(() => {

            loadingText.textContent =
                 loadingMessages[
                     messageIndex % loadingMessages.length
                 ];

            messageIndex++;

        }, 1500);

        const response = await fetch("/upload-resume", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        clearInterval(loadingInterval);

        loadingBox.style.display = "none";


        console.log("API Response:", data);

        // Handle backend errors
        if (data.error) {

    let errorMessage = data.error;

    if (
        errorMessage.includes("503") ||
        errorMessage.includes("UNAVAILABLE")
    ) {

        resultDiv.innerHTML = `
        <div class="error-card">

            <div class="error-icon">⚡</div>

            <h2>AI is thinking</h2>

            <p>
                Our AI is currently handling a large number of requests.
            </p>

            <p>
                Please wait a few moments and try again.
            </p>

        </div>
        `;

    } else {

        resultDiv.innerHTML = `
        <div class="error-card">

            <div class="error-icon">⚠️</div>

            <h2>Something Went Wrong</h2>

            <p>${errorMessage}</p>

        </div>
        `;
    }

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

        let atsVerdict = "";
let verdictColor = "";

if (data.ats_score >= 85) {

    atsVerdict = "🟢 ATS Friendly";
    verdictColor = "#ffffff22";

}
else if (data.ats_score >= 70) {

    atsVerdict = "🟡 Needs Optimization";
    verdictColor = "#eab308";

}
else {

    atsVerdict = "🔴 ATS Risk";
    verdictColor = "#dc2626";

}

        console.log("Job Match Data:", data.job_match);
        resultDiv.innerHTML = `

        <div class="score-card" style="background-color:${cardColor}; color:white;">
        <div
    class="ats-verdict"
    style="background:${verdictColor};"
>
    ${atsVerdict}
</div>
    <div class="stats-container">

    <div class="stat-card">
        <span class="stat-icon">⚒</span>
        <span class="stat-number">
            ${(data.skills || []).length}
        </span>
        <span class="stat-label">
            Skills
        </span>
    </div>

    <div class="stat-card">
        <span class="stat-icon">📁</span>
        <span class="stat-number">
            ${data.projects_count}
        </span>
        <span class="stat-label">
            Projects
        </span>
    </div>

    <div class="stat-card">
        <span class="stat-icon">🏆</span>
        <span class="stat-number">
            ${data.certifications_count}
        </span>
        <span class="stat-label">
            Certifications
        </span>
    </div>

    <div class="stat-card">
        <span class="stat-icon">💼</span>
        <span class="stat-number">
            ${data.has_experience ? "Yes" : "No"}
        </span>
        <span class="stat-label">
            Experience
        </span>
    </div>

</div>

    <div class="gauge">

        <svg width="180" height="180">

            <circle
                class="gauge-bg"
                cx="90"
                cy="90"
                r="70">
            </circle>

            <circle
                class="gauge-progress"
                cx="90"
                cy="90"
                r="70">
            </circle>

        </svg>

        <div class="gauge-text">
    ${data.ats_score}%
    <span class="gauge-label">
        ATS SCORE
    </span>
    </div>

    </div>

    <div class="resume-score-section">

    <p class="resume-score-label">
        Overall Resume Score
    </p>

    <h2 class="resume-score-number">
        ${data.resume_score}/100
    </h2>

    <p class="resume-level">
        ${data.resume_level}
    </p>

</div>

</div>

        <div class="section">
            <h3>📊 Score Breakdown</h3>

            <div class="breakdown-card">

    <p><strong>Skills</strong> (${data.score_breakdown.skills}/20)</p>
    <div class="progress">
        <div class="progress-fill"
             style="width:${(data.score_breakdown.skills/20)*100}%">
        </div>
    </div>

    <p><strong>Projects</strong> (${data.score_breakdown.projects}/25)</p>
    <div class="progress">
        <div class="progress-fill"
             style="width:${(data.score_breakdown.projects/25)*100}%">
        </div>
    </div>

    <p><strong>Experience</strong> (${data.score_breakdown.experience}/25)</p>
    <div class="progress">
        <div class="progress-fill"
             style="width:${(data.score_breakdown.experience/25)*100}%">
        </div>
    </div>

    <p><strong>Certifications</strong> (${data.score_breakdown.certifications}/10)</p>
    <div class="progress">
        <div class="progress-fill"
             style="width:${(data.score_breakdown.certifications/10)*100}%">
        </div>
    </div>

    <p><strong>Resume Structure</strong> (${data.score_breakdown.resume_structure}/20)</p>
    <div class="progress">
        <div class="progress-fill"
             style="width:${(data.score_breakdown.resume_structure/20)*100}%">
        </div>
    </div>

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

    <h3>🎯 Job Description Match</h3>

    <div class="breakdown-card" style="background:#fff8dc;">

        <p>
            <strong>Match Score:</strong>
            ${data.job_match.score}%
        </p>

        <h4>Matched Skills</h4>

        <div class="skills-container">

            ${(data.job_match.matched_skills || []).map(skill =>
                `<span class="skill-badge">${skill}</span>`
            ).join("")}

        </div>

        <h4 style="margin-top:15px;">
            Missing Skills
        </h4>

        <div class="skills-container">

            ${(data.job_match.missing_skills || []).map(skill =>
                `<span class="skill-badge"
                style="background:#dc2626;">
                ${skill}
                </span>`
            ).join("")}

        </div>

    </div>

</div>


        <div class="section">
            <h3>🛠 Skills</h3>

             <div class="skills-container">
                ${(data.skills || []).map(skill =>
                `<span class="skill-badge">${skill}</span>`
                ).join("")}
             </div>

        </div>

        <div class="section">
            <h3>💪 Strengths</h3>
            <ul>
                ${(data.strengths || []).map(item =>
                 `<li>${item}</li>`
                 ).join("")}
            </ul>
        </div>

        <div class="section">
             <h3>⚠ Weaknesses</h3>
             <ul>
                  ${(data.weaknesses || []).map(item =>
                    `<li>${item}</li>`
                   ).join("")}
             </ul>
        </div>

        <div class="section">
             <h3>💡 Suggestions</h3>
             <ul>
                ${(data.suggestions || []).map(item =>
                `<li>${item}</li>`
                 ).join("")}
             </ul>
        </div>

        `;
        setTimeout(() => {

    const circle =
        document.querySelector(".gauge-progress");

    if (!circle) return;

    const score =
        data.ats_score;

    const offset =
        440 - (440 * score / 100);

    circle.style.strokeDashoffset =
        offset;

}, 100);
    } catch (error) {

        console.error(error);

        resultDiv.innerHTML =
            "<h3>Error</h3><p>" + error.message + "</p>";
    }
});
improveBtn.addEventListener("click", async function () {

    try {

        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a resume first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        improvedResumeDiv.innerHTML =
            "<p>Improving resume...</p>";

        const response = await fetch(
            "/improve-resume",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();


        if (data.error) {

            improvedResumeDiv.innerHTML =
                `<p>${data.error}</p>`;

            return;
        }

        improvedResumeDiv.innerHTML = `
            <div class="section">
                <h3>🤖 AI Improved Resume</h3>

                <div class="breakdown-card">

                    <pre style="
                        white-space: pre-wrap;
                        font-family: Arial;
                    ">
${data.improved_resume}
                    </pre>

                </div>
            </div>
        `;

    } catch (error) {

        improvedResumeDiv.innerHTML =
            `<p>${error.message}</p>`;
    }

});

downloadBtn.addEventListener(
    "click",
    async function () {

        const file = fileInput.files[0];

        if (!file) {

            alert("Please upload a resume.");

            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
            "/download-improved-resume",
            {
                method: "POST",
                body: formData
            }
        );

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            "Improved_Resume.pdf";

        a.click();

        window.URL.revokeObjectURL(url);
    }
);

const themeBtn =
    document.getElementById("themeToggle");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        themeBtn.innerHTML =
            "☀ Light Mode";

    } else {

        themeBtn.innerHTML =
            "🌙 Dark Mode";
    }
});

const particlesContainer =
    document.getElementById("particles");

for (let i = 0; i < 30; i++) {

    const particle =
        document.createElement("div");

    particle.classList.add("particle");
    const size =
    3 + Math.random() * 6;

    particle.style.width =
    size + "px";

    particle.style.height =
    size + "px";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.animationDuration =
        (15 + Math.random() * 15) + "s";

    particle.style.animationDelay =
        Math.random() * 10 + "s";

    const colors = [
    "#06b6d4",
    "#7c3aed",
    "#3b82f6"
    ];

    particle.style.background =
    colors[
        Math.floor(
            Math.random() * colors.length
        )
    ];

    particle.style.boxShadow =
    `0 0 10px ${particle.style.background},
     0 0 20px ${particle.style.background}`;

    particle.style.opacity =
    0.5 + Math.random() * 0.5;

    particlesContainer.appendChild(
        particle
    );
}