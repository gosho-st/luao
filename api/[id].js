export default async function handler(req, res) {
    const { id } = req.query;

    // --- BROWSER BLOCKER ---
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const acceptHeader = (req.headers['accept'] || '').toLowerCase();
    
    // Check if the request looks like a standard web browser and NOT Roblox
    const isBrowser = userAgent.includes('mozilla') || userAgent.includes('applewebkit') || acceptHeader.includes('text/html');
    const isRoblox = userAgent.includes('roblox');

    if (isBrowser && !isRoblox) {
        res.setHeader("Content-Type", "text/html");
        return res.status(403).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied</title>
    <style>
        body {
            background-color: #0b0c10;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        h1 {
            color: #ff4a4a;
            font-size: 3.5rem;
            margin: 0 0 10px 0;
            font-weight: 700;
        }
        p {
            color: #ffffff;
            font-size: 1rem;
            margin: 0;
        }
    </style>
</head>
<body>
    <h1>Access Denied</h1>
    <p>Roblox only</p>
</body>
</html>`);
    }
    // -----------------------

    if (id === "save" || id === "auth") {
        res.setHeader("Content-Type", "text/plain");
        return res.status(404).send("print('voidexternal: Invalid ID')");
    }

    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        res.setHeader("Content-Type", "text/plain");
        return res.status(500).send("print('voidexternal: Database not linked')");
    }

    try {
        const resp = await fetch(`${url}/get/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!resp.ok) {
            res.setHeader("Content-Type", "text/plain");
            return res.status(404).send("print('voidexternal: Script not found')");
        }

        const data = await resp.json();
        const lua = data.result;

        if (!lua || lua === "null") {
            res.setHeader("Content-Type", "text/plain");
            return res.status(404).send("print('voidexternal: Script not found')");
        }

        res.setHeader("Content-Type", "text/plain");
        return res.status(200).send(lua);

    } catch (e) {
        res.setHeader("Content-Type", "text/plain");
        return res.status(500).send("print('voidexternal: Database Error')");
    }
}
