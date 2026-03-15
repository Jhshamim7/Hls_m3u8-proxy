import { gotScraping } from "got-scraping";

async function test() {
  try {
    const res = await gotScraping({
      url: "https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8",
      headers: {
        "Referer": "https://megacloud.com/",
      },
      responseType: "buffer"
    });
    console.log("Status:", res.statusCode);
    const buffer = res.body;
    console.log("Buffer length:", buffer.length);
    const text = buffer.toString("utf-8");
    if (text.includes("#EXTM3U")) {
      console.log("Found #EXTM3U at index:", text.indexOf("#EXTM3U"));
      console.log("Content:", text.substring(text.indexOf("#EXTM3U"), text.indexOf("#EXTM3U") + 200));
    } else {
      console.log("No #EXTM3U found in the buffer");
    }
  } catch (err: any) {
    console.log("Error Status:", err.response?.statusCode);
  }
}

test();
