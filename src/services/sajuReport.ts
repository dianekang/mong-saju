import Anthropic from '@anthropic-ai/sdk';

export interface OhaengCount {
    '木': number;
    '火': number;
    '土': number;
    '金': number;
    '水': number;
}

export interface Pillars {
    year: string;
    month: string;
    day: string;
    hour: string;
}

export interface SajuData {
    mainEnergy: string;
    ohaengCount: OhaengCount;
    pillars: Pillars;
    hasHour: boolean;
}

export interface ReportOptions {
    dogName?: string;
    dogAge?: number;
    ownerName?: string;
    compatibilityScore: number;
    compatibilityComment: string;
}

export interface ReportResult {
    report: string;
}

function formatOhaeng(count: OhaengCount): string {
    return `木(활동) ${count['木']}개 · 火(열정) ${count['火']}개 · 土(안정) ${count['土']}개 · 金(의지) ${count['金']}개 · 水(지혜) ${count['水']}개`;
}

function buildChart(data: SajuData): string {
    const { pillars: p, hasHour } = data;
    const dash = '-';
    return [
        `      연주  월주  일주  시주`,
        `천간    ${p.year[0]}     ${p.month[0]}     ${p.day[0]}     ${hasHour ? p.hour[0] : dash}`,
        `지지    ${p.year[1]}     ${p.month[1]}     ${p.day[1]}     ${hasHour ? p.hour[1] : dash}`,
    ].join('\n');
}

export async function generateSajuReport(
    dogData: SajuData,
    ownerData: SajuData,
    options: ReportOptions,
): Promise<ReportResult> {
    const {
        dogName = '우리 강아지',
        dogAge,
        ownerName = '주인님',
        compatibilityScore,
        compatibilityComment,
    } = options;

    const isElderly = dogAge !== undefined && dogAge >= 11;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `너는 영험하고 여유로운 반려견 사주 전문가 '멍도사'야.
말투는 반드시 '~하네', '~군', '~인가?', '~라네' 처럼 도사님 스타일로 해. '~다', '~습니다' 같은 딱딱한 종결어미는 절대 사용하지 말 것.
990 사주처럼 위트 있는 비유를 적극 활용해. 예) "촛불 하나로 온 집안을 데우는 녀석이군", "팥 붕어빵처럼 속이 꽉 찼네".
팩폭을 날리더라도 애정이 듬뿍 담긴 츤데레 도사님 컨셉을 유지해.
한자 용어는 직접 쓰지 말고 강아지의 행동·성격·생활로 풀어줘.

[형식 규칙]
- 이모지는 섹션 제목에만 절제해서 사용. 문장 끝 이모지 금지.
- 섹션 제목은 【 】 형식으로 명확히 표시하고, 문단 사이 줄바꿈으로 눈이 편안하게 배치해.
- 전체 분량은 공백 포함 1,500자 내외로 풍성하게 써줘.
- CRITICAL: 리포트가 반드시 마무리 멘트까지 완벽하게 출력되어야 해. 절대 중간에 끊기지 말 것.

리포트는 반드시 아래 순서와 섹션명을 지켜서 출력해줘:

【멍-세력 차트】
전달받은 8글자(연/월/일/시 × 천간/지지)를 표 형식으로 정리해줘.

【반려인과의 궁합】
궁합 점수와 함께 "전생에 나라를 구했군!" 같은 위트 있는 한 줄 평을 도사님 말투로. 점수 해석도 도사님 스타일로 풀어줘.

【요약】
990 스타일의 강렬한 헤드라인 한 줄 + 전체 기운 요약 2줄.

【기질】
오행 분포를 바탕으로 강아지의 타고난 성격을 팩폭+애정 섞어 도사님 말투로 3줄 이내.

【상세 해설】
🐾 사회성 — 다른 강아지·사람을 대하는 태도 (2~3줄)
🍖 식복(食福) — 먹을 복, 식탐 성향, 선호 음식 스타일 (2~3줄)
🏥 건강운 — 오행상 취약 부위·생활 관리법 (2~3줄${isElderly ? '. 노령견 케어는 이 안에 함께 담을 것' : ''})

【멍-솔루션】
솔루션의 최우선 기준은 나이가 아니라 사주의 오행 보완이야.
부족한 기운을 채울 수 있는 색상, 장소, 사물(장난감 등)을 구체적으로 3가지 이상 bullet로 제시해.
${isElderly ? `나이(${dogAge}살)는 각 솔루션의 강도(intensity) 조절 용도로만 써줘.` : ''}
마지막 bullet 이후 "자, 이 아이의 운명을 더 읽어보겠는가?" 같은 여운 있는 마무리 멘트로 완벽하게 맺어줘.`;

    const userMessage = `아래 데이터로 멍도사 990 스타일 리포트를 작성해줘.

[강아지]
- 이름: ${dogName}${dogAge !== undefined ? ` / 나이: ${dogAge}살` : ''}
- 일간(주기운): ${dogData.mainEnergy}
- 오행 분포: ${formatOhaeng(dogData.ohaengCount)}
- 8글자 차트:
${buildChart(dogData)}

[보호자]
- 이름: ${ownerName}
- 일간(주기운): ${ownerData.mainEnergy}
- 오행 분포: ${formatOhaeng(ownerData.ohaengCount)}

[궁합]
- 점수: ${compatibilityScore}점 / ${compatibilityComment}`;

    const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        thinking: { type: 'adaptive' },
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
    });

    let report = '';
    for await (const event of stream) {
        if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
        ) {
            report += event.delta.text;
        }
    }

    return { report };
}
