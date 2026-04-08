export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { script } = req.body;

    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return res.status(500).json({ error: "DB_NOT_LINKED" });

    const id = Math.random().toString(36).slice(2, 10);

    try {
        await fetch(`${url}/set/${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "text/plain"
            },
            body: script
        });

        return res.json({
            loadstring: `loadstring(game:HttpGet("https://${req.headers.host}/api/${id}", true))()`
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
