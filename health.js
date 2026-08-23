export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    kicad_connected: false,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-5',
    key_configured: !!process.env.ANTHROPIC_API_KEY,
  });
}
