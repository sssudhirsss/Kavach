// api/chat.js — Vercel serverless function.
// Proxies the Safety Assistant's chat requests to the real Anthropic API.
// The API key lives ONLY here (as a Vercel environment variable), never in
// the browser — index.html calls this same-origin endpoint instead of
// api.anthropic.com directly, which is what actually makes it work once
// deployed (direct client-side calls to Anthropic's API don't work from an
// arbitrary website — no key attached, and it doesn't allow that anyway).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });
    return;
  }

  const { system, messages, max_tokens } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: 'Missing "messages" in request body' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1000,
        system: system,
        messages: messages
      })
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Anthropic API proxy error:', err);
    res.status(502).json({ error: 'Could not reach the assistant backend' });
  }
}
