import { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: any = async (context: any) => {
  const { request } = context;
  const url = new URL(request.url);

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const urlParamIndex = request.url.indexOf("?url=");
  
  if (urlParamIndex === -1) {
    return new Response("Missing 'url' query parameter", { status: 400 });
  }

  let targetUrlStr = request.url.substring(urlParamIndex + 5);

  // Remove &type=m3u8 if present
  const typeParamIndex = targetUrlStr.indexOf("&type=");
  let isM3u8Type = false;
  if (typeParamIndex !== -1) {
    const typeValue = targetUrlStr.substring(typeParamIndex + 6);
    if (typeValue.startsWith("m3u8")) isM3u8Type = true;
    targetUrlStr = targetUrlStr.substring(0, typeParamIndex);
  }

  // Handle URL encoding
  if (targetUrlStr.toLowerCase().startsWith("http%3a") || targetUrlStr.toLowerCase().startsWith("https%3a")) {
    targetUrlStr = decodeURIComponent(targetUrlStr);
  }

  // Try to decode base64 if it doesn't start with http
  if (!targetUrlStr.startsWith("http")) {
    try {
      targetUrlStr = atob(targetUrlStr);
    } catch (e) {
      // Not base64, ignore
    }
  }

  try {
    const targetUrl = new URL(targetUrlStr);

    let referer = "https://megacloud.com/";
    let origin = "https://megacloud.com";

    if (targetUrlStr.includes("douvid.xyz")) {
      referer = "https://douvid.xyz/";
      origin = "https://douvid.xyz";
    } else if (targetUrlStr.includes("haildrop")) {
      referer = "https://megacloud.com/";
      origin = "https://megacloud.com";
    } else {
      referer = `${targetUrl.origin}/`;
      origin = targetUrl.origin;
    }

    const headers = new Headers();
    headers.set("Referer", referer);
    headers.set("Origin", origin);
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    
    // Pass along Range header if present (important for video segments!)
    const range = request.headers.get("Range");
    if (range) {
      headers.set("Range", range);
    }
    
    // Pass along Accept header
    const accept = request.headers.get("Accept");
    if (accept) {
      headers.set("Accept", accept);
    }

    // Create a new request based on the original request
    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      redirect: "follow",
    });

    // Fetch the target URL
    const response = await fetch(proxyRequest);

    let body: any = response.body;
    const contentType = response.headers.get("Content-Type") || "";
    
    // If it's an M3U8 playlist, we need to rewrite the URLs inside it
    if (targetUrl.pathname.endsWith(".m3u8") || contentType.includes("mpegurl") || isM3u8Type) {
      const text = await response.text();
      const baseUrl = targetUrl.origin + targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf("/") + 1);
      
      // Split by lines and rewrite URIs
      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        // Skip empty lines and comments (except URI tags)
        if (!trimmed) return line;
        
        // Handle URI tags like #EXT-X-STREAM-INF:...,URI="relative.m3u8"
        // and #EXT-X-KEY:METHOD=AES-128,URI="key.bin"
        if (trimmed.startsWith('#EXT-X-') && trimmed.includes('URI="')) {
          return line.replace(/URI="([^"]+)"/g, (match, uri) => {
            const absoluteUri = uri.startsWith('http') ? uri : new URL(uri, baseUrl).toString();
            // We base64 encode the rewritten URLs to match the frontend's expectation
            // and to avoid issues with nested query parameters
            const encodedUri = btoa(absoluteUri);
            const typeParam = absoluteUri.includes(".m3u8") ? "&type=m3u8" : "";
            const proxiedUri = `/api/proxy?url=${encodedUri}${typeParam}`;
            return `URI="${proxiedUri}"`;
          });
        }
        
        // Handle direct URLs (segments or playlists)
        if (!trimmed.startsWith('#')) {
          const absoluteUri = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).toString();
          const encodedUri = btoa(absoluteUri);
          const typeParam = absoluteUri.includes(".m3u8") ? "&type=m3u8" : "";
          return `/api/proxy?url=${encodedUri}${typeParam}`;
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
      // Ensure Content-Type is correct for m3u8
      proxyResponse.headers.set("Content-Type", "application/vnd.apple.mpegurl");
    }

    // Add CORS headers to the response
    proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
    proxyResponse.headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");
    
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
};
