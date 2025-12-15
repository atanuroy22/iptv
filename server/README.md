# IPTV Transmux Server (ffmpeg + Node)

Converts non-HLS streams (e.g., raw MPEG-TS at IP:port) into HLS (`.m3u8 + .ts`) so browsers can play them.

## Prerequisites
- Node.js 18+
- ffmpeg installed on the host (`ffmpeg -version` should work)

## Cloud Deployment (no local hosting)
You can deploy this server to a free cloud platform so your GitHub-hosted player can consume it over HTTPS.

### Option A: Railway (free tier)
1. Create an account at https://railway.app and create a new project → Deploy from GitHub or "New Service" → "Empty Service".
2. Add the files in `server` to a new GitHub repo (or the same repo) so Railway can build it.
3. Set build & start commands in Railway:
  - Install: `npm install`
  - Start: `node index.js`
4. Add environment variable `PORT=8080` (Railway injects a port; the server reads `process.env.PORT`).
5. Add ffmpeg plugin or buildpack: Railway provides ffmpeg via Nixpacks automatically for Node; if missing, add a preinstall script to fetch ffmpeg.
6. After deploy, you get a public HTTPS domain like `https://<project>.railway.app`.

### Option B: Render (free tier)
1. Create an account at https://render.com.
2. Use a PUBLIC GitHub repo (no login to private repos) with this project. We include a `render.yaml` at the repo root that points to `server/`.
3. In Render: New Web Service → “Public Git Repository” → paste your repo URL → Render will detect `render.yaml`.
4. It will build with `npm install` and start with `node index.js` under `server/` automatically.
5. ffmpeg: Our install script or base image usually provides ffmpeg. If missing, the preinstall fetcher helps.
6. You’ll get a public HTTPS domain like `https://<service>.onrender.com`.

### Option C: Fly.io (free tier)
1. Install Fly CLI and sign up: https://fly.io.
2. Use a Dockerfile to bundle Node + ffmpeg; deploy a single small instance.
3. Good when you need more control; free allowance is limited.

## API
- Start transmux job:
```bash
curl -X POST https://<your-domain>/transmux \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"http://87.255.35.150:18555\",\"name\":\"star-bharat\"}"
```
Response:
```json
{ "playlist": "/hls/star-bharat/index.m3u8", "status": "started" }
```

- Stop job:
```bash
curl -X POST https://<your-domain>/stop -H "Content-Type: application/json" -d "{\"name\":\"star-bharat\"}"
```

## Use in your playlist
After starting the job on your cloud domain, set the channel URL to:
```
https://<your-domain>/hls/star-bharat/index.m3u8
```
Your existing player will play it like any normal HLS stream (with proxy fallback if needed).

## Notes
- This copies codecs (`-c:v copy -c:a copy`) for efficiency. If a source needs re-encoding, adjust ffmpeg args.
- Keep list size small (`-hls_list_size 8`) for live playback and moderate storage.
 - If your source is plain HTTP, your browser page is HTTPS (GitHub Pages), and mixed-content blocks it, your Cloudflare Worker proxy will handle HTTPS and CORS for the HLS output as needed.
 - The repo includes a best-effort ffmpeg fetcher (`scripts/fetch-ffmpeg.js`) that runs on install to download a static ffmpeg when missing (Linux/Windows). This helps free cloud deploys where ffmpeg isn’t preinstalled.