from flask import Flask, render_template, request, jsonify, session
import json
import os
import psycopg2
import re
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'cyber_security_secret_key_2026'

# PostgreSQL connection string
DB_URL = "dbname=postgres user=postgres password=suga host=localhost port=5432"

def get_db_connection():
    return psycopg2.connect(DB_URL)

def validate_email(email):
    # Basic email regex validation
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create users table with email
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Check if email column exists, if not add it (for migration)
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE users ADD COLUMN email TEXT UNIQUE")

    # Create leaderboard table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()

# Initialize DB on start
init_db()

@app.route('/')
def home():
    with open('questions.json') as f:
        questions = json.load(f)
    return render_template("index.html", questions=questions)

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({"status": "error", "message": "Missing fields"}), 400
    
    if not validate_email(email):
        return jsonify({"status": "error", "message": "Invalid email format"}), 400
    
    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO users (username, email, password) VALUES (%s, %s, %s)', (username, email, hashed_password))
        conn.commit()
        return jsonify({"status": "success", "message": "Registration successful"})
    except psycopg2.IntegrityError:
        return jsonify({"status": "error", "message": "Username or email already exists"}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"status": "error", "message": "Missing username or password"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT password FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user and check_password_hash(user[0], password):
        session['username'] = username
        return jsonify({"status": "success", "username": username})
    
    return jsonify({"status": "error", "message": "Invalid username or password"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({"status": "success", "message": "Logged out successfully"})

@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')
    
    if not email or not new_password:
        return jsonify({"status": "error", "message": "Missing fields"}), 400
    
    hashed_password = generate_password_hash(new_password)
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE users SET password = %s WHERE email = %s', (hashed_password, email))
    if cur.rowcount > 0:
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "success", "message": "Password reset successful"})
    else:
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Email not found"}), 404

@app.route('/submit_score', methods=['POST'])
def submit_score():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    score = request.json.get('score')
    username = session['username']
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO leaderboard (username, score) VALUES (%s, %s)', (username, score))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"status": "success"})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    leaderboard = [{"username": r[0], "score": r[1]} for r in rows]
    return jsonify(leaderboard)

if __name__ == '__main__':
    app.run(debug=True)