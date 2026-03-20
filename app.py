from flask import Flask, render_template, request, jsonify, session
import json
import os

app = Flask(__name__)
app.secret_key = 'cyber_security_secret_key_2026'

LEADERBOARD_FILE = 'leaderboard.json'

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, 'w') as f:
            json.dump([], f)
    with open(LEADERBOARD_FILE, 'r') as f:
        return json.load(f)

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def home():
    with open('questions.json') as f:
        questions = json.load(f)
    return render_template("index.html", questions=questions)

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    if username:
        session['username'] = username
        return jsonify({"status": "success", "username": username})
    return jsonify({"status": "error", "message": "Username required"}), 400

@app.route('/submit_score', methods=['POST'])
def submit_score():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    score = request.json.get('score')
    username = session['username']
    
    leaderboard = load_leaderboard()
    leaderboard.append({"username": username, "score": score})
    # Sort by score descending and keep top 10
    leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:10]
    save_leaderboard(leaderboard)
    
    return jsonify({"status": "success", "leaderboard": leaderboard})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    return jsonify(load_leaderboard())

if __name__ == '__main__':
    app.run(debug=True)