from flask import Flask
from flask import render_template

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route("/")
def index():
    return render_template("index.html", **locals())
