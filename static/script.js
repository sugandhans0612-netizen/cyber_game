let current = 0;
let score = 0;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startGame() {
    shuffle(questions);
    document.getElementById("intro").style.display = "none";
    document.getElementById("game").style.display = "block";
    loadQuestion();
}

function loadQuestion() {
    const q = questions[current];
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
            showGameOver();
        }
    }, 1500);
}

function showGameOver() {
    const container = document.getElementById("container");
    container.innerHTML = `
        <h2 class="cyber-flicker">MISSION COMPLETE</h2>
        <p>FINAL SCORE: ${score} / ${questions.length}</p>
        <button onclick="location.reload()">REBOOT SYSTEM</button>
    `;
}
