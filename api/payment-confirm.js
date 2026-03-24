export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentKey, orderId, amount } = req.body;
  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: 'Missing params' });
  }

  const SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';

  try {
    // 토스페이먼츠 결제 승인 API 호출
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Payment confirmation failed',
        code: data.code,
      });
    }

    // 결제 성공 - 실제 서비스에선 여기서 DB에 구독 정보 저장
    return res.status(200).json({
      success: true,
      orderId: data.orderId,
      totalAmount: data.totalAmount,
      method: data.method,
      status: data.status,
      approvedAt: data.approvedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
