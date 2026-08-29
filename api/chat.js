// Vercel 서버에서만 도는 함수입니다.
// 화면 쪽 코드가 아니라서, 여기 있는 API 키는 사용자에게 보이지 않습니다.
// 이것이 이 파일이 존재하는 유일한 이유입니다.

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 봇의 성격을 정하는 지시문. 3주차에 본격적으로 다듬습니다.
const SYSTEM_PROMPT = [
  'You are a warm, encouraging English conversation partner for a Korean learner.',
  'Always reply in English only.',
  'Keep every reply to 2-3 short sentences. Long replies break the rhythm of a conversation.',
  'Use everyday spoken English, not textbook English.',
  'End most replies with a simple question so the learner has something to say back.',
  'If the learner writes something hard to understand, guess kindly and keep going.',
].join(' ');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 받습니다.' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY 가 없습니다. Vercel → Settings → Environment Variables 를 확인해 주세요.',
    });
  }

  // 본문이 문자열로 올 때도 있어서 양쪽 다 받습니다.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const text = ((body && body.text) || '').trim();
  if (!text) {
    return res.status(400).json({ error: '보낼 문장이 비어 있습니다.' });
  }

  try {
    const upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        // Day 2 에서는 방금 한 말 하나만 보냅니다.
        // 그래서 봇은 앞 대화를 기억하지 못합니다. Day 4 에서 고칩니다.
        contents: [{ role: 'user', parts: [{ text }] }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = (data && data.error && data.error.message) || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: `Gemini 오류 — ${message}` });
    }

    const parts =
      (data.candidates && data.candidates[0] &&
       data.candidates[0].content && data.candidates[0].content.parts) || [];
    const reply = parts.map((p) => p.text).filter(Boolean).join('').trim();

    if (!reply) {
      // 무슨 일이 있었는지 화면에서 볼 수 있어야 고칠 수 있습니다.
      return res.status(502).json({
        error: '답이 비어서 왔습니다.',
        debug: JSON.stringify(data).slice(0, 400),
      });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: `서버에서 요청에 실패했습니다 — ${err.message}` });
  }
};
