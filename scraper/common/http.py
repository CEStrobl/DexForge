import time

import requests

DEFAULT_DELAY_SECONDS = 0.05


def get_json(url: str, session: requests.Session, retries: int = 3, delay: float = DEFAULT_DELAY_SECONDS) -> dict:
    for attempt in range(1, retries + 1):
        response = session.get(url, timeout=30)
        if response.status_code == 200:
            time.sleep(delay)
            return response.json()
        if attempt == retries:
            response.raise_for_status()
        time.sleep(delay * attempt * 4)
    raise RuntimeError(f"Failed to fetch {url}")
