from crypt import methods
from tkinter import W
from flask import Flask
from flask import request, redirect, session, Response
from flask import render_template_string
from flask import render_template
from flask_socketio import SocketIO, join_room, send, emit, rooms
from datetime import timedelta
import json

import hashlib
from lib.redischat import chatclient

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = "6*HT!99052y"
app.permanent_session_lifetime = timedelta(days=1000)

socketio = SocketIO(app)


@app.context_processor
def inject_config():
    return dict(version="0.7")


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


@app.route("/<room_id>/fetch/")
def fetch(room_id):
    nick = session.get("nick", None)
    if nick is None:
        return [], 422

    chats = chatclient.get_chats_for_room(room_id, request.args.get("from", None))
    reply = []
    for chat in chats:
        res = render_template("partials/bubble.html", **locals())
        reply.append((res, chat))

    reading_now = []
    for chat in chats:
        if chat["from"] != nick:
            reading_now.append(chat["id"])

    if len(reading_now) > 0:
        chatclient.markread(room_id, reading_now, nick)
        socketio.send({"action": "markread", "ids": reading_now}, to=room_id)

    alivenicks = chatclient.get_live_users(room_id)

    return {"chats": reply, "nicks": alivenicks}


@app.route("/set/<key>/<value>/", methods=["POST"])
def settings(key, value):
    session[key] = value

    return {}, 200


@app.route("/<room_id>/")
def room(room_id):
    settings = {"s_notification": session.get("s_notification", "on")}
    settings_j = json.dumps(settings)
    nick = session.get("nick", None)
    if nick is None:
        return redirect("/")

    return render_template("room.html", **locals())


@app.route("/relay/<room_id>/", methods=["POST"])
def relay(room_id):
    nick = session.get("nick", "").strip()
    if nick == "":
        return {}, 422

    data = request.get_json()
    msg = data.get("msg", None)

    chat = chatclient.send(room_id, nick, msg)
    socketio.send({"action": "incoming", "from": nick}, to=room_id)

    markup = render_template("partials/bubble.html", **locals())
    return {"status": "success", "markup": markup}, 200


@socketio.on("join")
def on_join(data):
    nick = session.get("nick", "").strip()
    if nick == "":
        print("Empty nick, cannot join!")
        return
    room_id = data.get("room_id")
    join_room(room_id)
    print(f"{nick} -> joined -> {room_id}")
    chatclient.alive(nick, room_id)
    send({"action": "join", "nick": nick}, to=room_id)


@socketio.on("disconnect")
def on_disconnect():
    nick = session.get("nick", "").strip()
    print(f"{nick} -> disconnected.")
    in_rooms = rooms(request.sid)
    for room_id in in_rooms:
        send({"action": "disconnect", "nick": nick}, to=room_id)


@socketio.on("alive")
def on_alive(data):
    nick = session.get("nick", "").strip()
    room_id = data.get("room_id")
    chatclient.alive(nick, room_id)


@socketio.on("markopen")
def on_open(data):
    nick = session.get("nick", "").strip()
    room_id = data.get("room_id", "").strip()
    message_id = data.get("id", "").strip()

    chatclient.markread(room_id, [message_id], nick, xkey="open")
    socketio.send({"action": "markopen", "id": message_id}, to=room_id)


@socketio.on("typing")
def on_typing(data):
    nick = session.get("nick", "").strip()
    room_id = data.get("room_id")
    socketio.send({"action": "typing", "nick": nick}, to=room_id)


if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port="10022")
