// api/chat.js — Vercel serverless function.
// Proxies the Safety Assistant's chat requests to the real Anthropic API.
// The API key lives ONLY here (as a Vercel environment variable), never in
// the browser — index.html calls this same-origin endpoint instead of
// api.anthropic.com directly, which is what actually makes it work once
// deployed (direct client-side calls to Anthropic's API don't work from an
// arbitrary website — no key attached, and it doesn't allow that anyway).

async function readJsonBody(req) {
  // Vercel usually parses req.body automatically for JSON requests, but if
  // that didn't happen for any reason (runtime/config quirk), fall back to
  // reading the raw request stream ourselves rather than failing.
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

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

  const body = await readJsonBody(req);
  const { system, messages, max_tokens } = body;
  if (!messages) {
    res.status(400).json({ error: 'Missing "messages" in request body', debugReceivedKeys: Object.keys(body) });
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
