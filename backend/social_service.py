"""
Social downloader service (Instagram + VSCO)
"""
import json
import re
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import requests

DOWNLOADS_DIR = Path(__file__).parent.parent / "social_downloads"
jobs = {}


def _new_job(platform: str, url: str) -> str:
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "downloading",
        "platform": platform,
        "url": url,
        "progress": 0,
        "log": [],
        "files": [],
    }
    return job_id


def _append_log(job_id: str, line: str) -> None:
    if job_id not in jobs:
        return
    jobs[job_id]["log"].append(line)


def _get_ytdlp_cmd() -> str:
    base = Path(__file__).parent.parent
    embedded = base / "python_embeded" / "Scripts" / "yt-dlp.exe"
    if embedded.exists():
        return str(embedded)
    venv = base / "venv" / "Scripts" / "yt-dlp.exe"
    if venv.exists():
        return str(venv)
    return "yt-dlp"


def _cookie_args(cookie_source: str) -> list[str]:
    mapping = {
        "chrome": ["--cookies-from-browser", "chrome"],
        "edge": ["--cookies-from-browser", "edge"],
        "firefox": ["--cookies-from-browser", "firefox"],
        "cookies.txt": ["--cookies", "cookies.txt"],
    }
    return mapping.get(cookie_source, [])


def start_instagram_download(url: str, cookie_source: str = "none", limit: Optional[int] = None) -> str:
    job_id = _new_job("instagram", url)
    thread = threading.Thread(
        target=_instagram_download_thread,
        args=(job_id, url, cookie_source, limit),
        daemon=True,
    )
    thread.start()
    return job_id


def _instagram_download_thread(job_id: str, url: str, cookie_source: str, limit: Optional[int]) -> None:
    try:
        out_root = DOWNLOADS_DIR / "instagram"
        out_root.mkdir(parents=True, exist_ok=True)

        cmd = [_get_ytdlp_cmd()]
        cmd.extend(_cookie_args(cookie_source))
        cmd.extend(["--no-warnings", "--newline"])
        if limit:
            cmd.extend(["--playlist-items", f"1:{limit}"])

        # Keep best quality possible from source
        cmd.extend(["-f", "bestvideo*+bestaudio/best"])
        cmd.extend(["-P", str(out_root)])
        cmd.extend(["-o", "%(uploader|unknown)s/%(upload_date>%Y-%m-%d)s - %(id)s - %(title).100B.%(ext)s"])
        cmd.append(url)

        _append_log(job_id, f"Running: {' '.join(cmd)}")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )

        for line in iter(process.stdout.readline, ""):
            line = line.strip()
            if not line:
                continue
            _append_log(job_id, line)
            m = re.search(r"(\d+\.?\d*)%", line)
            if m:
                jobs[job_id]["progress"] = float(m.group(1))
            if "[download] Destination:" in line:
                fp = line.split("Destination:", 1)[-1].strip()
                if fp:
                    jobs[job_id]["files"].append(fp)
            elif "has already been downloaded" in line:
                fp = line.split("has already been downloaded")[0].replace("[download]", "").strip()
                if fp:
                    jobs[job_id]["files"].append(fp)

        process.wait()
        if process.returncode == 0:
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["progress"] = 100
            _append_log(job_id, "Instagram download complete.")
        else:
            jobs[job_id]["status"] = "error"
            _append_log(job_id, f"yt-dlp exited with code {process.returncode}")
    except Exception as e:
        jobs[job_id]["status"] = "error"
        _append_log(job_id, f"Error: {e}")


def start_vsco_download(url: str) -> str:
    job_id = _new_job("vsco", url)
    thread = threading.Thread(target=_vsco_download_thread, args=(job_id, url), daemon=True)
    thread.start()
    return job_id


def _extract_vsco_state(html: str) -> dict:
    m = re.search(r"window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});", html, re.S)
    if not m:
        raise ValueError("VSCO state not found on page")
    return json.loads(m.group(1))


def _guess_vsco_profile(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host.endswith("vsco.co"):
        sub = host.split(".")[0]
        if sub and sub != "www":
            return sub
    path = parsed.path.strip("/").split("/")
    return path[0] if path and path[0] else f"vsco_{uuid.uuid4().hex[:6]}"


def _vsco_download_thread(job_id: str, url: str) -> None:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=20)
        resp.raise_for_status()

        state = _extract_vsco_state(resp.text)
        profile_name = _guess_vsco_profile(url)

        site_id = None
        sites = (state.get("sites") or {}).get("bySubdomain") or {}
        if isinstance(sites, dict) and sites:
            key = next(iter(sites.keys()))
            site_id = sites[key].get("id")
            profile_name = key or profile_name
        if not site_id:
            raise ValueError("Could not resolve VSCO site id")

        out_dir = DOWNLOADS_DIR / "vsco" / profile_name
        out_dir.mkdir(parents=True, exist_ok=True)

        medias = []
        cursor = ""
        with requests.Session() as s:
            while True:
                api = f"https://vsco.co/api/2.0/sites/{site_id}/medias?size=100&page=1&cursor={cursor}"
                r = s.get(api, headers=headers, timeout=20)
                r.raise_for_status()
                data = r.json()
                chunk = data.get("medias") or []
                medias.extend(chunk)
                cursor = data.get("next_cursor") or ""
                if not cursor:
                    break

            total = len(medias)
            if total == 0:
                raise ValueError("No VSCO media found")

            for idx, media in enumerate(medias, start=1):
                media_url = (
                    media.get("image_url")
                    or media.get("video_url")
                    or media.get("responsive_url")
                    or ""
                )
                if not media_url:
                    continue
                if media_url.startswith("//"):
                    media_url = "https:" + media_url
                elif media_url.startswith("/"):
                    media_url = "https://vsco.co" + media_url

                filename = media_url.split("?")[0].split("/")[-1] or f"media_{idx}.jpg"
                dest = out_dir / filename
                if dest.exists() and dest.stat().st_size > 0:
                    jobs[job_id]["files"].append(str(dest))
                    jobs[job_id]["progress"] = int((idx / total) * 100)
                    continue

                rr = s.get(media_url, headers=headers, timeout=30, stream=True)
                rr.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in rr.iter_content(chunk_size=1024 * 128):
                        if chunk:
                            f.write(chunk)
                jobs[job_id]["files"].append(str(dest))
                jobs[job_id]["progress"] = int((idx / total) * 100)
                _append_log(job_id, f"Downloaded {idx}/{total}: {filename}")

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        _append_log(job_id, "VSCO download complete.")
    except Exception as e:
        jobs[job_id]["status"] = "error"
        _append_log(job_id, f"Error: {e}")


def get_download_status(job_id: str) -> dict:
    return jobs.get(job_id, {"status": "not_found"})
