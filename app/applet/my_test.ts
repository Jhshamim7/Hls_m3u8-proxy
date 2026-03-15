import { gotScraping } from "got-scraping";

async function run() {
  try {
    const res = await gotScraping({
      url: "https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8",
      headers: {
        "Referer": "https://megacloud.com/",
      },
      responseType: "buffer"
    });
    console.log("MY_TEST Status:", res.statusCode);
    const buffer = res.body;
    console.log("MY_TEST Buffer length:", buffer.length);
    const text = buffer.toString("utf-8");
    if (text.includes("#EXTM3U")) {
      console.log("MY_TEST Found #EXTM3U at index:", text.indexOf("#EXTM3U"));
    } else {
      console.log("MY_TEST No #EXTM3U found in the buffer");
    }
  } catch (err: any) {
    console.log("MY_TEST Error Status:", err.response?.statusCode);
  }
}

run();
