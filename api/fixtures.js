// api/fixtures.js
import fetch from "node-fetch";
import translate from "@vitalets/google-translate-api";

// --- Clean text helper
function cleanText(str = "") {
  return str.replace(/[^\p{L}\p{N}\s\-\/]/gu, "").trim();
}

// --- Robust JSONP parser
function parseJSONP(text, name) {
  try {
    const cleaned = text.replace(/^[^\{]*?(\{[\s\S]*\})[^}]*$/u, "$1");
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`JSONP format mismatch (${name})`);
  }
}

// --- Fetch all live rooms for VNRES safely
async function fetchVNRES() {
  try {
    const timestamp = Date.now();
    const base = "https://json.vnres.co";

    // Fetch all live rooms
    const text = await fetch(`${base}/all_live_rooms.json?v=${timestamp}`).then(r => r.text());
    const data = parseJSONP(text, "all_live_rooms");

    const rawFixtures = Object.values(data.data).flat();
    const fixtures = [];

    for (const f of rawFixtures) {
      if (f.liveStatus !== 1) continue;

      const fixtureClean = cleanText(f.title);
      let fixtureEn = fixtureClean;

      try {
        const t = await translate(fixtureClean, { to: "en" });
        fixtureEn = t.text;
      } catch {
        console.warn("⚠️ Translation failed for:", f.title);
      }

      // Fetch room detail
      const detailText = await fetch(`${base}/room/${f.roomNum}/detail.json?v=${Date.now()}`).then(r => r.text());
      const matchDetail = detailText.match(/^detail\(([\s\S]*)\);?$/);
      if (!matchDetail) {
        console.warn(`⚠️ detail.json JSONP mismatch for room ${f.roomNum}`);
        continue;
      }

      const detailData = JSON.parse(matchDetail[1]);
      const stream = detailData?.data?.stream || {};

      fixtures.push({
        room_id: f.roomNum,
        fixture_original: f.title,
        fixture_en: fixtureEn,
        anchor: f.anchor?.nickName || "Unknown",
        cover: f.cover,
        viewers: f.viewCount,
        live_status: f.liveStatus,
        level: f.anchor?.growDto?.name || "N/A",
        flv_sd: stream.flv || null,
        flv_hd: stream.hdFlv || null,
        m3u8_sd: stream.m3u8 || null,
        m3u8_hd: stream.hdM3u8 || null,
      });
    }

    return fixtures;
  } catch (err) {
    console.warn("⚠️ VNRES fetch failed:", err.message);
    return [];
  }
}

// --- Vercel API handler
export default async function handler(req, res) {
  try {
    const fixtures = await fetchVNRES();
    res.status(200).json({ total: fixtures.length, fixtures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
