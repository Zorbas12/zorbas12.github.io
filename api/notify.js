export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { oneSignalId, externalId, title, body } = req.body;
  if (!oneSignalId && !externalId) return res.status(400).json({ error: 'Missing ID' });

  const APP_ID = '078eeaff-76ec-478a-95f9-1553e1e54a27';
  const REST_KEY = process.env.ONESIGNAL_REST_KEY;
  if (!REST_KEY) return res.status(500).json({ error: 'Missing server config' });

  // Build targeting — prefer subscription ID, fall back to external_id
  const targeting = oneSignalId
    ? { include_subscription_ids: [oneSignalId] }
    : { include_aliases: { external_id: [externalId] }, target_channel: 'push' };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_KEY}`
      },
      body: JSON.stringify({
        app_id: APP_ID,
        ...targeting,
        headings: { en: title || 'Zorbas' },
        contents: { en: body || '' },
        data: { targetUrl: '/history' }
      })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
