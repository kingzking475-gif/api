export default async function handler(req, res) {
  try {
    const url = `https://json.vnres.co/all_live_rooms.json?v=${Date.now()}`;
    const response = await fetch(url);
    const text = await response.text();

    res.status(200).json({
      status: response.status,
      preview: text.slice(0, 300),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
