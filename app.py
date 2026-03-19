from flask import Flask, render_template
import json

app = Flask(__name__)

@app.route('/')
def home():
    with open('questions.json') as f:
        questions = json.load(f)
    return render_template("index.html", questions=questions)

if __name__ == '__main__':
    app.run(debug=True)