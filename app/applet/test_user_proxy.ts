import fetch from "node-fetch";

async function test() {
  const proxyUrl = "https://hls-m3u8-proxy-1.jahinalamshamim.workers.dev/api/proxy?url=https://example.com";
  console.log("Fetching:", proxyUrl);
  try {
    const res = await fetch(proxyUrl);
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    const text = await res.text();
    console.log("Body:", text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}
test();
