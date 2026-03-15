import express from "express";
import { gotScraping } from "got-scraping";
import cors from "cors";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  app.get("/api/proxy", async (req, res) => {
    try {
      let targetUrlStr = req.query.url as string;
      if (!targetUrlStr) {
        return res.status(400).send("Missing url parameter");
      }

      // Handle URL encoding for plain URLs
      if (targetUrlStr.toLowerCase().startsWith("http%3a") || targetUrlStr.toLowerCase().startsWith("https%3a")) {
        targetUrlStr = decodeURIComponent(targetUrlStr);
      }

      // Try to decode base64 if it doesn't start with http
      if (!targetUrlStr.startsWith("http")) {
        try {
          const decodedStr = decodeURIComponent(targetUrlStr);
          targetUrlStr = Buffer.from(decodedStr, "base64").toString("utf-8");
        } catch (e) {
          // Not base64, ignore
        }
      }

      const targetUrl = targetUrlStr;
      
      let referer = "https://megacloud.com/";
      let origin = "https://megacloud.com";

      if (targetUrl.includes("douvid.xyz")) {
        referer = "https://douvid.xyz/";
        origin = "https://douvid.xyz";
      } else if (targetUrl.includes("haildrop")) {
        referer = "https://megacloud.com/";
        origin = "https://megacloud.com";
      } else {
        try {
          const urlObj = new URL(targetUrl);
          referer = `${urlObj.origin}/`;
          origin = urlObj.origin;
        } catch (e) {
          // Fallback if URL parsing fails
        }
      }

      const headers = {
        "Referer": referer,
        "Origin": origin,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      };

      // Check if it's an m3u8 file
      const isM3u8 = targetUrl.includes(".m3u8") || req.query.type === "m3u8" || req.query.ext === ".m3u8";

      if (isM3u8) {
        const response = await gotScraping({
          url: targetUrl,
          headers,
          responseType: "text",
        });
        const body = response.body;

        const lines = body.split("\n");
        const rewrittenLines = lines.map((line: string) => {
          const trimmed = line.trim();
          
          // Rewrite segment and sub-playlist URLs
          if (trimmed && !trimmed.startsWith("#")) {
            let absoluteUrl = trimmed;
            if (!trimmed.startsWith("http")) {
              const baseUrl = new URL(targetUrl);
              absoluteUrl = new URL(trimmed, baseUrl).toString();
            }
            const encodedAbsoluteUrl = encodeURIComponent(Buffer.from(absoluteUrl).toString("base64"));
            const ext = absoluteUrl.includes(".m3u8") ? "&ext=.m3u8" : (absoluteUrl.includes(".ts") ? "&ext=.ts" : "");
            return `/api/proxy?url=${encodedAbsoluteUrl}${ext}`;
          } 
          
          // Rewrite EXT-X-KEY URIs (for encrypted streams)
          if (trimmed.startsWith("#EXT-X-KEY:")) {
            const uriMatch = trimmed.match(/URI="([^"]+)"/);
            if (uriMatch) {
              const keyUrl = uriMatch[1];
              let absoluteKeyUrl = keyUrl;
              if (!keyUrl.startsWith("http")) {
                const baseUrl = new URL(targetUrl);
                absoluteKeyUrl = new URL(keyUrl, baseUrl).toString();
              }
              const encodedKeyUrl = encodeURIComponent(Buffer.from(absoluteKeyUrl).toString("base64"));
              const ext = absoluteKeyUrl.includes(".m3u8") ? "&ext=.m3u8" : (absoluteKeyUrl.includes(".ts") ? "&ext=.ts" : "");
              const newUri = `/api/proxy?url=${encodedKeyUrl}${ext}`;
              return trimmed.replace(`URI="${keyUrl}"`, `URI="${newUri}"`);
            }
          }
          
          return line;
        });

        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");
        return res.send(rewrittenLines.join("\n"));
      } else {
        // Stream segments (.ts, .m4s, etc.)
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");
        
        const stream = gotScraping.stream({
          url: targetUrl,
          headers,
        });

        stream.on("response", (response: any) => {
          if (response.headers["content-type"]) {
            res.setHeader("Content-Type", response.headers["content-type"]);
          }
          if (response.headers["content-length"]) {
            res.setHeader("Content-Length", response.headers["content-length"]);
          }
        });

        stream.on("error", (error: any) => {
          console.error("Stream error:", error.message);
          if (!res.headersSent) {
            res.status(500).send("Stream Error");
          }
        });

        stream.pipe(res);
      }
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      if (error.response) {
        res.status(error.response.statusCode || 500).send(error.response.statusMessage || "Error");
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
