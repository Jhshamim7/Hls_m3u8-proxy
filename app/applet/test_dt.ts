import fetch from "node-fetch";

async function test() {
  const proxyUrl = "http://localhost:3000/api/proxy?url=https://dt.netmagcdn.com:2228/hls-playback/1b72b13ad0a1f768d4c6e45d1b80d2c41c3a23531a8301e71ff30d9046a73e3925b1e6c4c2f44a8eb265288f26c84c266964aa31fb2d8da8e25f8d081b5ca721ce59c0c60bf4ee293d759e3284a3d84448f7c7fb06391bc0f2b3feb537d1762debbf404158ce61b232feae78ba29a54c6c09c6b776dc8c20151b1182d73b10b64a35f23e9cfd2943f5b2930ca4da28be/master.m3u8";
  console.log("Fetching:", proxyUrl);
  try {
    const res = await fetch(proxyUrl);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
test();
