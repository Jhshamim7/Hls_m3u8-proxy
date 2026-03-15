import { gotScraping } from "got-scraping";

async function run() {
  try {
    const res = await gotScraping({
      url: "https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8",
      headers: {
        "Referer": "https://megacloud.com/",
        "Accept": "*/*"
      },
      responseType: "buffer"
    });
    console.log("Status:", res.statusCode);
    console.log("Content-Type:", res.headers["content-type"]);
  } catch (err: any) {
    console.log("MY_TEST Error Status:", err.response?.statusCode);
  }
}

run();
