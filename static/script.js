let current = 0;
let score = 0;
let username = "";

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function login() {
    const input = document.getElementById("usernameInput");
    username = input.value.trim();

    if (!username) {
        alert("PLEASE ENTER A CODENAME, AGENT.");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (response.ok) {
            document.getElementById("agentName").innerText = username.toUpperCase();
            document.getElementById("login-section").style.display = "none";
            document.getElementById("intro").style.display = "block";
        }
    } catch (error) {
        console.error("Login failed:", error);
    }
}

function startGame() {
    shuffle(questions);
    current = 0;
    score = 0;
    document.getElementById("scoreVal").innerText = "0";
    document.getElementById("intro").style.display = "none";
    document.getElementById("game").style.display = "block";
    loadQuestion();
}

function loadQuestion() {
    const q = questions[current];
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        const progress = (current / questions.length) * 100;
        progressBar.style.width = progress + "%";
    }
    document.getElementById("question").innerText = q.q;
    document.getElementById("btn0").innerText = q.options[0];
    document.getElementById("btn1").innerText = q.options[1];
    document.getElementById("result").innerText = "";
}

function checkAnswer(i) {
    const q = questions[current];
    const resultEl = document.getElementById("result");
    const scoreValEl = document.getElementById("scoreVal");

    if (i === q.answer) {
        score++;
        resultEl.innerText = "ACCESS GRANTED: CORRECT";
        resultEl.style.color = "#00ffcc";
    } else {
        resultEl.innerText = "ACCESS DENIED: INCORRECT";
        resultEl.style.color = "#ff3333";
    }

    scoreValEl.innerText = score;
    current++;

    setTimeout(() => {
        if (current < questions.length) {
            loadQuestion();
        } else {
            finishGame();
        }
    }, 1500);
}

async function finishGame() {
    const gameEl = document.getElementById("game");
    gameEl.setAttribute('data-label', '// MISSION_REPORT');
    
    // Update progress bar to 100% at the end
    const progressBar = document.getElementById("progressBar");
    if (progressBar) progressBar.style.width = "100%";

    gameEl.innerHTML = `
        <h2 class="cyber-flicker">MISSION_COMPLETE</h2>
        <div class="result-box">
            <p>AGENT: ${username.toUpperCase()}</p>
            <p>FINAL_SCORE: ${score} / ${questions.length}</p>
            <p id="uploadStatus">UPLOADING_SCORE_TO_MAINFRAME...</p>
        </div>
    `;

    try {
        await fetch('/submit_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        
        document.getElementById("uploadStatus").innerText = "SCORE_UPLOADED_SUCCESSFULLY";
        gameEl.innerHTML += `<div class="btn-row">
            <button onclick="showLeaderboard()" class="secondary-btn">LEADERBOARD</button>
            <button onclick="location.reload()" class="start-btn">▶ REBOOT SYSTEM</button>
        </div>`;
    } catch (error) {
        console.error("Score submission failed:", error);
        document.getElementById("uploadStatus").innerText = "UPLOAD_FAILED: CONNECTION_LOST";
        gameEl.innerHTML += `<div class="btn-row">
            <button onclick="location.reload()" class="start-btn">▶ RETRY_REBOOT</button>
        </div>`;
    }
}

async function showLeaderboard() {
    document.getElementById("intro").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("leaderboard-section").style.display = "block";

    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        const tbody = document.getElementById("leaderboardBody");
        tbody.innerHTML = "";

        data.forEach((entry, index) => {
            const row = `
                <tr>
                    <td>#${index + 1}</td>
                    <td>${entry.username.toUpperCase()}</td>
                    <td>${entry.score}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
    }
}

function hideLeaderboard() {
    document.getElementById("leaderboard-section").style.display = "none";
    document.getElementById("intro").style.display = "block";
}
