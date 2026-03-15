import { gotScraping } from "got-scraping";

async function test() {
  try {
    const res = await gotScraping({
      url: "https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8",
      headers: {
        "Referer": "https://megacloud.com/",
      },
      responseType: "text"
    });
    console.log("Status:", res.statusCode);
    console.log("Body:", res.body.substring(0, 100));
  } catch (err: any) {
    console.log("Error Status:", err.response?.statusCode);
    console.log("Error Body:", err.response?.body);
  }
}

test();
