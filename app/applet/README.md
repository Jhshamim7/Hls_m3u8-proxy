# Cloudflare Worker Proxy

A simple Cloudflare Worker that acts as a proxy, specifically designed to bypass basic restrictions by injecting headers like `Referer` and `User-Agent`.

## Deployment via GitHub

1. Fork or clone this repository to your GitHub account.
2. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** -> **Overview**.
4. Click **Create application** -> **Pages** -> **Connect to Git**.
5. Select your repository and configure the build:
   - **Framework preset**: None
   - **Build command**: `npm install && npm run deploy`
   - **Build output directory**: (leave blank)
   - *Note: For Workers, it's often easier to deploy via GitHub Actions. See below.*

### Deploying via GitHub Actions (Recommended)

1. Go to your repository settings on GitHub -> **Secrets and variables** -> **Actions**.
2. Add a new repository secret named `CLOUDFLARE_API_TOKEN` with a token generated from your Cloudflare profile (needs Edit permissions for Workers).
3. Add a new repository secret named `CLOUDFLARE_ACCOUNT_ID` with your Cloudflare Account ID.
4. Create a file `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy Worker
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Usage

Once deployed, you can use the proxy endpoint like this:

```
https://your-worker-subdomain.workers.dev/api/proxy?url=https://example.com/file.m3u8
```

The worker automatically adds CORS headers and injects `Referer: https://megacloud.com/` to bypass restrictions.
