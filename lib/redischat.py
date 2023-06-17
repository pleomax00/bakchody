REDIS_HOST = "redis"
REDIS_PORT = 6379

import redis


class RedisChat:
    def __init__(self, hostname, port):
        r = redis.Redis(host=hostname, port=port)
        r.scan_iter("")

    def send(self, room_id, from_user):
        pass


chatclient = RedisChat(REDIS_HOST, REDIS_PORT)
