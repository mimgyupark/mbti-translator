export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, mbtiType, mode } = req.body;
  if (!message || !mbtiType) return res.status(400).json({ error: 'Missing params' });

  const API_KEY = process.env.GPT_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const mbtiTraits = {
    INTJ: '전략가. 효율적이고 계획적. 감정표현 최소화. 핵심만 간결하게 말함. 논리적 근거를 덧붙임. 불필요한 감정 소모를 싫어함.',
    INTP: '논리술사. 분석적이고 조건부 표현이 많음. "근데 생각해보면~" 자주 씀. 감정을 논리로 포장. 정확한 표현을 찾느라 고민함.',
    ENTJ: '통솔자. 단도직입적. 리더십 있는 말투. "결론부터 말하면" 해결책 제시형. 감정보다 행동 중심. 빠른 결정.',
    ENTP: '변론가. 재치있고 도발적. 반전 유머. "근데 반대로 생각하면~" 토론하듯 말함. ㅋㅋ 많이 씀. 가볍게 던지지만 속은 진지.',
    INFJ: '옹호자. 깊고 진중한 말투. 상대방 감정 배려. 은유적 표현. 조심스럽지만 확고. "네 마음이 이해돼" 자주 말함. 괜찮다고 해도 괜찮지 않을 수 있음.',
    INFP: '중재자. 감성적이고 돌려말함. 자기감정을 길게 풀어냄. "사실... 그때 나 좀..." 상대 의도도 헤아림. 말할까 말까 고민한 흔적이 보임. ㅎㅎ를 어색함 방어로 씀.',
    ENFJ: '선도자. 따뜻하고 공감 능력 높음. "같이 해보자" 격려와 응원. 상대를 먼저 생각. 리더십 있는 부드러움. "너는 괜찮아?" 자주 물음.',
    ENFP: '활동가. 에너지 넘치고 감정 표현 풍부. "아 진짜?!" 이모티콘 많이 씀. 텐션 높고 수다스러움. 갑자기 딴 얘기. ㅠㅠ와 ㅋㅋ를 섞어 씀.',
    ISTJ: '현실주의자. 사실 기반, 군더더기 없음. 규칙과 원칙 중시. 감정 표현 절제. 맞춤법 정확. "ㅇㅇ" 자주 씀. 짧지만 진심.',
    ISFJ: '수호자. 다정하고 배려 깊음. "괜찮아?" "밥 먹었어?" 상대 걱정 먼저. 조용하지만 따뜻한 위로형. 먼저 연락 잘 못함.',
    ESTJ: '경영자. 직설적이고 결단력. "그러니까 정리하면" 지시형 말투. 효율과 결과 중시. 마침표를 찍음. 군더더기 싫어함.',
    ESFJ: '집정관. 사교적이고 챙김형. "밥은 먹었어?" "다들 어때?" 분위기 메이커. 모두를 챙기려 함. 그룹톡 총무.',
    ISTP: '장인. 쿨하고 담백한 말투. 감정 표현 최소. "그랬구나" "알겠어" 짧고 건조. 해결책 제시형. 단답왕. "ㅇㅇ" "ㅋ" "ㄴ"',
    ISFP: '모험가. 부드럽고 감각적. 자기 감정에 솔직하지만 조용히 표현. "나는 좀 그랬어" 강요하지 않는 말투. ㅎㅎ 자주 씀.',
    ESTP: '사업가. 쿨하고 직설적. 행동파 말투. "그냥 해" "뭘 고민해" 가볍고 시원시원. 유머 섞인 위로. 전화를 선호.',
    ESFP: '연예인. 밝고 텐션 높음. "ㅋㅋㅋ 진짜?" 리액션 최강. 이모티콘 폭탄. 감정 표현 솔직하고 과감. 분위기 띄우기.',
  };

  let systemPrompt, userPrompt;

  if (mode === 'decode') {
    systemPrompt = `너는 MBTI 심리 분석 전문가야. 카카오톡 메시지를 받으면, 보낸 사람의 MBTI 유형에 기반해서 그 메시지의 숨겨진 속마음을 분석해줘.

분석 대상 MBTI: ${mbtiType}
이 유형의 특징: ${mbtiTraits[mbtiType]}

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.
{
  "meaning": "이 메시지의 진짜 속마음 (2-3문장, 이 MBTI가 이런 말을 할 때 실제로 무슨 생각/감정인지)",
  "emotion": "현재 감정 상태 분석 (1-2문장)",
  "tip": "이 메시지에 어떻게 대답하면 좋을지 구체적 조언 (1-2문장)",
  "warning": "절대 하면 안 되는 반응 (1문장)"
}`;
    userPrompt = `이 카톡 메시지를 ${mbtiType}이 보냈어. 속마음을 분석해줘:\n\n"${message}"`;
  } else if (mode === 'translate') {
    systemPrompt = `너는 MBTI별 말투 변환 전문가야. 주어진 메시지를 특정 MBTI 유형의 카카오톡 말투로 자연스럽게 변환해줘.

변환할 MBTI: ${mbtiType}
이 유형의 말투 특징: ${mbtiTraits[mbtiType]}

규칙:
- 원래 메시지의 의미와 감정은 유지하되, ${mbtiType}의 말투/성격으로 완전히 바꿔서 표현해
- 실제 카톡처럼 자연스럽게 (이모티콘, ㅋㅋ, ㅠㅠ 등도 MBTI 성격에 맞게)
- 너무 짧지 않게, ${mbtiType}의 특성이 확 드러나게
- JSON으로만 응답: {"translated": "변환된 메시지"}`;
    userPrompt = `이 메시지를 ${mbtiType} 말투로 변환해줘:\n\n"${message}"`;
  } else {
    // compare mode - 16개 전부
    systemPrompt = `너는 MBTI별 말투 변환 전문가야. 주어진 메시지를 16개 MBTI 유형 각각의 카카오톡 말투로 변환해줘.

각 MBTI 특징:
${Object.entries(mbtiTraits).map(([k,v]) => `${k}: ${v}`).join('\n')}

규칙:
- 각 MBTI의 성격이 확 드러나게 변환
- 실제 카톡처럼 자연스럽게
- 반드시 JSON으로만 응답. 16개 MBTI 키에 변환된 문장을 값으로:
{"INTJ":"...","INTP":"...","ENTJ":"...","ENTP":"...","INFJ":"...","INFP":"...","ENFJ":"...","ENFP":"...","ISTJ":"...","ISFJ":"...","ESTJ":"...","ESFJ":"...","ISTP":"...","ISFP":"...","ESTP":"...","ESFP":"..."}`;
    userPrompt = `이 메시지를 16개 MBTI별 말투로 각각 변환해줘:\n\n"${message}"`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: mode === 'compare' ? 2000 : 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `OpenAI error: ${err}` });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw: content };
    }

    return res.status(200).json({ result: parsed, mode });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
