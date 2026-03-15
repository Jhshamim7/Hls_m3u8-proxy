import fetch from "node-fetch";

async function test() {
  const proxyUrl = "https://hls-m3u8-proxy-1.jahinalamshamim.workers.dev/api/proxy?url=https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8";
  console.log("Fetching:", proxyUrl);
  try {
    const res = await fetch(proxyUrl);
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    const text = await res.text();
    console.log("Body:", text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
test();
