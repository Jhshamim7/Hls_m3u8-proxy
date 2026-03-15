# Cloudflare HLS Proxy Worker

A pure, standalone Cloudflare Worker designed to proxy HLS (`.m3u8` and `.ts`) video streams. It bypasses basic restrictions by injecting headers like `Referer`, `Origin`, and `User-Agent`, and rewrites internal M3U8 URLs so that video segments are also routed through the proxy.

This project contains **no frontend or UI**—it is strictly a backend proxy endpoint designed to be used with custom HLS players.

## Usage

Once deployed to Cloudflare Workers, you can use the proxy endpoint by passing the target URL (either plain text or Base64 encoded) via the `url` query parameter.

**Example with Plain URL:**
```
https://your-worker-subdomain.workers.dev/?url=https://example.com/video/master.m3u8
```

**Example with Base64 Encoded URL:**
```
https://your-worker-subdomain.workers.dev/?url=aHR0cHM6Ly9leGFtcGxlLmNvbS92aWRlby9tYXN0ZXIubTN1OA==
```

### Features:
- **Strict Player Support:** Automatically appends `&ext=.m3u8` and `&ext=.ts` to rewritten URLs so strict HLS players (like VLC, AVPlayer, ExoPlayer) accept the streams.
- **Robust Base64 Decoding:** Handles URL-safe Base64 characters (`-` and `_`) and URL-encoded Base64 strings.
- **Header Spoofing:** Injects `Referer: https://megacloud.com/` (and others based on the URL) to bypass hotlinking restrictions.
- **Range Requests:** Forwards `Range` headers for efficient video seeking.
- **CORS:** Automatically handles CORS preflight requests and injects `Access-Control-Allow-Origin: *`.

## Deployment via GitHub Actions (Recommended)

1. Fork or clone this repository to your GitHub account.
2. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and get your **Account ID**.
3. Generate a **Cloudflare API Token** with `Edit` permissions for Workers.
4. Go to your GitHub repository settings -> **Secrets and variables** -> **Actions**.
5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.
6. The included `.github/workflows/deploy.yml` will automatically deploy the worker to Cloudflare every time you push to the `main` branch.

## Manual Deployment (Wrangler)

If you have Node.js and Wrangler installed locally:

```bash
npm install
npx wrangler deploy
```
