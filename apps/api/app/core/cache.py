import os
import json
import hashlib
from typing import Optional, Dict, Any
import redis.asyncio as redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def generate_cache_key(text: str, model: str, engine: str, extra: str = "") -> str:
    """Generate a unique SHA-256 hash for the input to use as a cache key."""
    raw = f"{text}|{model}|{engine}|{extra}".encode("utf-8")
    return f"promptoptima:{hashlib.sha256(raw).hexdigest()}"

async def get_cached_result(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached optimization result if exists."""
    try:
        cached = await redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"Redis get error: {e}")
    return None

async def set_cached_result(key: str, data: Dict[str, Any], expire_seconds: int = 86400):
    """Store optimization result in cache for 24 hours."""
    try:
        await redis_client.setex(key, expire_seconds, json.dumps(data))
    except Exception as e:
        print(f"Redis set error: {e}")
