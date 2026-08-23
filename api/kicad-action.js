// Vercel serverless function.
// Lives at /api/action once deployed. Right now this SIMULATES what KiCad
// would do — no local machine or KiCad connection exists yet. This is the
// one function that gets replaced with a call to your local KiCad bridge
// program once that's built. Nothing in kicad.html needs to change then.

const KNOWN_TEMPLATES = {
  voltage_divider: 'a voltage divider (R1 from VIN down to the tap node, R2 from the tap node to GND)',
  rc_lowpass: 'an RC low-pass filter (R in series from the input, C from the output node to GND)',
  rc_highpass: 'an RC high-pass filter (C in series from the input, R from the output node to GND)',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, template, params = {} } = req.body || {};

  if (action !== 'build_circuit') {
    res.status(200).json({ status: 'ignored', message: `No handler yet for action '${action}'.` });
    return;
  }

  if (!KNOWN_TEMPLATES[template]) {
    res.status(200).json({
      status: 'unsupported',
      message: `I don't have a template for '${template}' yet. Known templates: ${Object.keys(KNOWN_TEMPLATES).join(', ')}.`,
    });
    return;
  }

  const description = KNOWN_TEMPLATES[template];
  const paramStr =
    Object.entries(params || {})
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ') || 'no specific values given';

  res.status(200).json({
    status: 'simulated',
    message: `(Simulated — KiCad isn't connected yet) I would build ${description}, using ${paramStr}.`,
  });
}
