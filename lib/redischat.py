REDIS_HOST = "redis"
REDIS_PORT = 6379
EXPIRY = 30 * 60

import datetime
from os import read
import time
import redis
import json
import base64


class RedisChat:
    def __init__(self, hostname, port):
        self.redis = redis.Redis(host=hostname, port=port)

    def alive(self, nick, room_id):
        self.redis.set(f"_NICK_{room_id}_{nick}_", nick, 4)

    def get_live_users(self, room_id):
        alive_nicks = []
        for nick in self.redis.scan_iter(f"_NICK_{room_id}_*"):
            alive_nicks.append(nick)
        alive_nicks = self.redis.mget(alive_nicks)
        return list(map(lambda x: x.decode(), alive_nicks))

    def send(self, room_id, from_user, msg, img=None):
        chat_id = self.redis.incr(f"_CTR_{room_id}_")
        chat_id = str(chat_id).rjust(8, "0")

        chatobj = {
            "from": from_user,
            "msg": msg,
            "id": chat_id,
            "timestamp": int(time.time()),
        }
        if img != None:
            img = base64.b64encode(img)
            chatobj["img"] = img.decode()

        self.redis.set(
            f"_CHAT_{room_id}_{chat_id}_",
            json.dumps(chatobj),
        )
        return chatobj

    def get_chats_for_room(self, room_id, start_from=None):
        alive_chats = []
        for key in self.redis.scan_iter(f"_CHAT_{room_id}_*"):
            alive_chats.append(key)

        alive_chats = sorted(alive_chats)
        if start_from is not None:
            alive_chats = list(
                filter(
                    lambda x: int(x.decode().split("_")[3]) > int(start_from),
                    alive_chats,
                )
            )
        values = self.redis.mget(alive_chats)

        result = []
        for key, chat in zip(alive_chats, values):
            if chat is None:
                continue
            obj = json.loads(chat)
            iid = key.decode().split("_")[3]
            obj["id"] = iid

            result.append(obj)

        return result

    def markread(self, room_id, message_ids, by_nick, xkey="read"):
        vals = {}
        keys = list(map(lambda x: f"_CHAT_{room_id}_{x}_", message_ids))
        res = self.redis.mget(keys)
        pipe = self.redis.pipeline()

        for thiskey, chat in zip(keys, res):
            if chat is None:
                continue
            obj = json.loads(chat)
            obj[xkey] = True
            if xkey + "_by" in obj:
                obj[xkey + "_by"].append(by_nick)
            else:
                obj[xkey + "_by"] = [by_nick]
            obj[xkey + "_by"] = list(set(obj[xkey + "_by"]))
            pipe.set(thiskey, json.dumps(obj), keepttl=True)

            if xkey == "open":
                # Delete the key from server permanently after EXPIRY
                pipe.expire(thiskey, EXPIRY)

        pipe.execute()


chatclient = RedisChat(REDIS_HOST, REDIS_PORT)
