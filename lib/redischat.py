REDIS_HOST = "redis"
REDIS_PORT = 6379

import datetime
import time
import redis
import json


class RedisChat:
    def __init__(self, hostname, port):
        self.redis = redis.Redis(host=hostname, port=port)

    def alive(self, nick, room_id):
        self.redis.set(f"_NICK_{room_id}_{nick}_", nick, 5)

    def get_live_users(self, room_id):
        alive_nicks = []
        for nick in self.redis.scan_iter(f"_NICK_{room_id}_*"):
            alive_nicks.append(nick)
        alive_nicks = self.redis.mget(alive_nicks)
        return list(map(lambda x: x.decode(), alive_nicks))

    def send(self, room_id, from_user, msg):
        chat_id = self.redis.incr(f"_CTR_{room_id}_")
        chat_id = str(chat_id).rjust(8, "0")

        chatobj = {
            "from": from_user,
            "msg": msg,
            "id": chat_id,
            "timestamp": int(time.time()),
        }

        self.redis.set(
            f"_CHAT_{room_id}_{chat_id}_",
            json.dumps(chatobj),
            ex=15 * 60,
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


chatclient = RedisChat(REDIS_HOST, REDIS_PORT)
