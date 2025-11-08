import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

const proxy = "http://46.105.57.253:PORT"; // replace PORT
const agent = new HttpsProxyAgent(proxy);

const response = await fetch(`https://json.vnres.co/all_live_rooms.json?v=${Date.now()}`, { agent });
const text = await response.text();
console.log(text);
