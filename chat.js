// Vercel serverless function.
// Lives at /api/chat once deployed. The browser calls this; this function
// holds the real Anthropic API key (set in your Vercel project's
// Environment Variables, never in this file) and forwards the request.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in this project\'s Environment Variables.' });
    return;
  }

  const { messages = [], system = '', max_tokens = 400 } = req.body || {};

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-5',
        max_tokens,
        system,
        messages,
      }),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}
