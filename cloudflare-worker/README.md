# Cloudflare Worker HLS CORS Proxy

This tiny Worker proxies `.m3u8` manifests and HLS segments, adds CORS headers, and optionally sets a `Referer` if needed. Deploy it to make browser playback work for sources that block direct access.

## Deploy

1. Install Wrangler:
   ```powershell
   npm i -g wrangler
   ```
2. Init and deploy:
   ```powershell
   cd cloudflare-worker
   wrangler init --yes
   wrangler deploy
   ```
3. Note your worker URL, e.g. `https://iptv-proxy.<your-subdomain>.workers.dev`

## Usage

- Template style: `https://iptv-proxy.workers.dev/?u={url}`
- Prefix style: `https://iptv-proxy.workers.dev/` + `<full-url>`

Example:
- Player query: `.../player/index.html?url=.../output/zee.m3u&proxy=https://iptv-proxy.workers.dev/?u={url}`

The player will automatically try built‑in proxies first; when you provide your own proxy via `?proxy=`, it prioritizes it and uses it for HLS segments too.
