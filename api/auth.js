export default async function handler(req, res) {
    // --- STATIC CONFIGURATION ---
    const CLIENT_ID = "1487218163828523108"; 
    const REDIRECT_URI = "https://voidexternal.xyz/api/auth";
    const ADMIN_WEBHOOK = "https://discord.com/api/webhooks/1490007893716631683/xNNedQgKAVcXAI0BeN2XEcMu3kyKjCy3pA6AkYidr-KGtVk487QcvVtjNW2nXT8_Q6Cz";
    // ----------------------------

    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const GUILD_ID = process.env.GUILD_ID;

    const { code } = req.query;

    // Grab the user's IP address from Vercel headers
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP';

    if (!code) {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`;
        return res.redirect(authUrl);
    }

    try {
        // Step 1: Exchange code for token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) return res.status(400).send(`Auth Error: ${tokenData.error}`);

        // Step 2: Get Discord User Info (Name + ID)
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();

        // Step 3: Send full log to your private webhook
        await fetch(ADMIN_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "ð¤ User Authorization Log",
                    color: 0x9333ea, // Neon Purple
                    fields: [
                        { 
                            name: "Discord Account", 
                            value: `**Tag:** ${userData.username}\n**ID:** \`${userData.id}\``, 
                            inline: true 
                        },
                        { 
                            name: "Network Info", 
                            value: `**IP:** \`${clientIp}\`\n[ð Geolocation](https://ipinfo.io/${clientIp})`, 
                            inline: true 
                        }
                    ],
                    footer: { text: "voidexternal security" },
                    timestamp: new Date()
                }]
            })
        });

        // Step 4: Join the server
        if (GUILD_ID && BOT_TOKEN) {
            await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userData.id}`, {
                method: 'PUT',
                body: JSON.stringify({ access_token: tokenData.access_token }),
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });
        }

        return res.redirect('/?login=success');

    } catch (e) {
        console.error(e);
        return res.status(500).send("Internal Server Error");
    }
}
