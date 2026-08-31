// Vercel 서버에서만 도는 함수입니다.
// 화면 쪽 코드가 아니라서, 여기 있는 API 키는 사용자에게 보이지 않습니다.
// 이것이 이 파일이 존재하는 유일한 이유입니다.

// 모델 이름은 바뀔 수 있습니다. 실제로 2026-08-29 에 한 번 바뀌었습니다.
// 그래서 Vercel 환경변수 GEMINI_MODEL 로도 바꿀 수 있게 해뒀습니다.
// 환경변수가 없으면 아래 기본값을 씁니다.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 대화가 길어지면 매번 보내는 양도 같이 늘어납니다.
// 느려지고 무료 한도도 빨리 닳으므로, 최근 것만 보냅니다.
const MAX_MESSAGES = 20;   // 최근 20개 (주고받기 10번)
const MAX_CHARS = 1000;    // 한 번에 보낼 수 있는 글자 수

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
  body = body || {};

  // 화면에서 지금까지의 대화를 통째로 보내줍니다.
  // 옛 화면이 캐시에 남아 text 하나만 보낼 수도 있어 그 경우도 받습니다.
  let messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages && typeof body.text === 'string') {
    messages = [{ role: 'user', text: body.text }];
  }
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: '보낼 대화가 비어 있습니다.' });
  }

  // 모양이 맞는 것만 골라내고, 너무 긴 것은 잘라냅니다.
  const clean = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      text: m.text.trim().slice(0, MAX_CHARS),
    }))
    .slice(-MAX_MESSAGES);

  if (clean.length === 0) {
    return res.status(400).json({ error: '보낼 문장이 비어 있습니다.' });
  }
  // 마지막은 반드시 사용자 차례여야 합니다.
  if (clean[clean.length - 1].role !== 'user') {
    return res.status(400).json({ error: '마지막 차례가 사용자 발언이 아닙니다.' });
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
        // Day 4 부터는 지금까지의 대화를 통째로 보냅니다.
        // Gemini 는 대화를 기억하지 않습니다. 매번 처음부터 읽습니다.
        // "기억"처럼 보이는 것은, 우리가 매번 전체를 다시 들려주기 때문입니다.
        contents: clean.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = (data && data.error && data.error.message) || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: `Gemini 오류 (모델: ${MODEL}) — ${message}` });
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
