import { ExecutionContext } from "@cloudflare/workers-types";

export interface Env {
  // Add any environment variables here
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
        },
      });
    }

    if (url.pathname === "/api/proxy") {
      const urlParamIndex = request.url.indexOf("?url=");
      
      if (urlParamIndex === -1) {
        return new Response("Missing 'url' query parameter", { status: 400 });
      }

      const targetUrlStr = request.url.substring(urlParamIndex + 5);

      try {
        const targetUrl = new URL(targetUrlStr);

        // Create a new request based on the original request
        const proxyRequest = new Request(targetUrl.toString(), {
          method: request.method,
          headers: request.headers as any,
          body: request.body,
          redirect: "follow",
        });

        // Modify headers to bypass simple bot protections or pass required headers
        // For example, setting the Referer header that was needed in your previous tests
        proxyRequest.headers.set("Referer", "https://megacloud.com/");
        proxyRequest.headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        
        // Remove headers that might cause issues when proxying
        proxyRequest.headers.delete("Host");
        proxyRequest.headers.delete("Origin");

        // Fetch the target URL
        const response = await fetch(proxyRequest);

        let body: any = response.body;
        const contentType = response.headers.get("Content-Type") || "";
        
        // If it's an M3U8 playlist, we need to rewrite the URLs inside it
        if (targetUrl.pathname.endsWith(".m3u8") || contentType.includes("mpegurl")) {
          const text = await response.text();
          const baseUrl = targetUrl.origin + targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf("/") + 1);
          
          // Split by lines and rewrite URIs
          const lines = text.split('\n');
          const rewrittenLines = lines.map(line => {
            line = line.trim();
            // Skip empty lines and comments (except URI tags)
            if (!line) return line;
            
            // Handle URI tags like #EXT-X-STREAM-INF:...,URI="relative.m3u8"
            if (line.startsWith('#EXT-X-') && line.includes('URI="')) {
              return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                const absoluteUri = uri.startsWith('http') ? uri : new URL(uri, baseUrl).toString();
                const proxiedUri = `/api/proxy?url=${encodeURIComponent(absoluteUri)}`;
                return `URI="${proxiedUri}"`;
              });
            }
            
            // Handle direct URLs (segments or playlists)
            if (!line.startsWith('#')) {
              const absoluteUri = line.startsWith('http') ? line : new URL(line, baseUrl).toString();
              return `/api/proxy?url=${encodeURIComponent(absoluteUri)}`;
            }
            
            return line;
          });
          
          body = rewrittenLines.join('\n');
        }

        // Create a new response so we can modify the headers
        const proxyResponse = new Response(body, response);

        // If we modified the body, we must remove headers that are no longer valid
        if (typeof body === 'string') {
          proxyResponse.headers.delete("Content-Encoding");
          proxyResponse.headers.delete("Content-Length");
        }

        // Add CORS headers to the response
        proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
        
        // Remove headers that might cause issues in the browser
        proxyResponse.headers.delete("X-Frame-Options");
        proxyResponse.headers.delete("Content-Security-Policy");

        return proxyResponse;
      } catch (error: any) {
        return new Response(`Error proxying request: ${error.message}`, {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // Default response for other paths
    return new Response(
      "Cloudflare Proxy Worker is running. Use /api/proxy?url=YOUR_URL",
      {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }
    );
  },
};
