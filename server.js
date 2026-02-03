require('dotenv').config();
const path = require('path');
const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Vocabulary Quiz <onboarding@resend.dev>';
const TO_EMAIL = 'kingjcy@g.skku.edu';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/contact', async (req, res) => {
  const { name, phone, email } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ error: '이름, 전화번호, 이메일을 모두 입력해 주세요.' });
  }

  if (!resend) {
    console.error('RESEND_API_KEY가 설정되지 않았습니다. .env 파일에 추가 후 서버를 재시작하세요.');
    return res.status(503).json({ error: '메일 발송 설정이 되어 있지 않습니다.' });
  }

  const subject = `[영어 퀴즈] 연락 요청 - ${name}`;
  const html = `
    <h2>영어 단어 퀴즈 사이트에서 연락 요청이 왔습니다.</h2>
    <p><strong>이름:</strong> ${escapeHtml(name)}</p>
    <p><strong>전화번호:</strong> ${escapeHtml(phone)}</p>
    <p><strong>이메일:</strong> ${escapeHtml(email)}</p>
    <hr>
    <p style="color:#888;font-size:12px;">이 메일은 Resend를 통해 자동 발송되었습니다.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: '메일 전송에 실패했습니다.' });
    }

    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: '메일 전송 중 오류가 발생했습니다.' });
  }
});

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

app.listen(PORT, () => {
  console.log(`서버: http://localhost:${PORT}`);
  if (!RESEND_API_KEY) {
    console.warn('경고: RESEND_API_KEY가 없습니다. .env에 설정하면 메일 발송이 가능합니다.');
  }
});
