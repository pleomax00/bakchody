from crypt import methods
from flask import Flask
from flask import request, redirect, session, Response
from flask import render_template
from datetime import timedelta

import hashlib
from lib.redischat import chatclient

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = "6*HT!99052y"
app.permanent_session_lifetime = timedelta(days=1000)


@app.route("/", methods=["GET", "POST"])
def index():
    roomid = session.get("roomid", "")
    nick = session.get("nick", "")

    if request.method == "POST":
        session.permanent = True
        roomid = request.form.get("room", None)
        nick = request.form.get("nick", None)
        nick = nick.strip()
        roomid = roomid.strip()
        if nick is not None:
            session["nick"] = nick
            session["roomid"] = roomid
        roomid = hashlib.sha256(roomid.encode()).hexdigest()[:10]
        return redirect(f"/{roomid}/")

    return render_template("index.html", **locals())


@app.route("/<room_id>/")
def room(room_id):
    nick = session.get("nick", "Anonymous")

    return render_template("room.html", **locals())


@app.route("/relay/<room_id>/", methods=["POST"])
def relay(room_id):
    nick = session.get("nick", None)
    if nick is None:
        return {}, 422

    chatclient.send(
        room_id,
        nick,
    )
