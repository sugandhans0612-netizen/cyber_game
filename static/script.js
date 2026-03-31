let current = 0;
let score = 0;
let username = "";

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("authTitle");
    const desc = document.getElementById("authDesc");
    const btn = document.getElementById("authBtn");
    const toggleLink = document.querySelector("#authToggle a");
    const emailInput = document.getElementById("emailInput");

    if (isLoginMode) {
        title.innerText = "SECURE ACCESS REQUIRED";
        desc.innerHTML = "Identity verification mandatory before mission briefing.<br>State your codename, Agent.";
        btn.innerText = "▶ AUTHORIZE";
        toggleLink.innerText = "REGISTER_IDENTITY";
        emailInput.style.display = "none";
    } else {
        title.innerText = "IDENTITY REGISTRATION";
        desc.innerHTML = "Establish a new operative profile.<br>Choose your codename, email and secure passcode.";
        btn.innerText = "▶ REGISTER";
        toggleLink.innerText = "ALREADY_AUTHORIZED";
        emailInput.style.display = "block";
    }
}

async function handleAuth() {
    const usernameInput = document.getElementById("usernameInput");
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");
    const u = usernameInput.value.trim();
    const e = emailInput.value.trim();
    const p = passwordInput.value.trim();

    if (!u || !p || (!isLoginMode && !e)) {
        alert("PLEASE ENTER ALL REQUIRED FIELDS.");
        return;
    }

    const endpoint = isLoginMode ? '/login' : '/register';
    const payload = isLoginMode ? { username: u, password: p } : { username: u, email: e, password: p };
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                username = u;
                document.getElementById("agentName").innerText = username.toUpperCase();
                document.getElementById("login-section").style.display = "none";
                document.getElementById("intro").style.display = "block";
                document.getElementById("statusVal").innerText = "AUTHORIZED";
                document.getElementById("logoutBtn").style.display = "block";
            } else {
                alert("REGISTRATION SUCCESSFUL. YOU MAY NOW AUTHORIZE.");
                toggleAuthMode();
            }
        } else {
            alert(data.message.toUpperCase());
        }
    } catch (error) {
        console.error("Auth failed:", error);
        alert("COMMUNICATION ERROR: SYSTEM OFFLINE");
    }
}

async function logout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

function showForgotPassword() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("forgot-password-section").style.display = "block";
}

function hideForgotPassword() {
    document.getElementById("forgot-password-section").style.display = "none";
    document.getElementById("login-section").style.display = "block";
}

async function resetPassword() {
    const email = document.getElementById("recoveryEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();

    if (!email || !newPassword) {
        alert("PLEASE ENTER BOTH EMAIL AND NEW PASSCODE.");
        return;
    }

    try {
        const response = await fetch('/forgot_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, new_password: newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert("PASSCODE RESET SUCCESSFUL. YOU MAY NOW AUTHORIZE.");
            hideForgotPassword();
        } else {
            alert(data.message.toUpperCase());
        }
    } catch (error) {
        console.error("Reset failed:", error);
        alert("COMMUNICATION ERROR: SYSTEM OFFLINE");
    }
}

function startGame() {
    shuffle(questions);
    current = 0;
    score = 0;
    document.getElementById("scoreVal").innerText = "0";
    document.getElementById("statusVal").innerText = "MISSION_ACTIVE";
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
    
    // Dynamically load all 4 options
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`btn${i}`);
        if (q.options[i]) {
            btn.innerText = q.options[i];
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    }
    
    document.getElementById("result").innerText = "";
    document.getElementById("result").className = ""; // Clear feedback classes
}

function checkAnswer(i) {
    const q = questions[current];
    const resultEl = document.getElementById("result");
    const scoreValEl = document.getElementById("scoreVal");

    if (i === q.answer) {
        score++;
        resultEl.innerText = "ACCESS GRANTED: CORRECT";
        resultEl.className = "correct";
    } else {
        resultEl.innerText = "ACCESS DENIED: INCORRECT";
        resultEl.className = "wrong";
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
    document.getElementById("statusVal").innerText = "MISSION_COMPLETE";
    
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
