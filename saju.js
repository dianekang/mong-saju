require('dotenv').config();
const { Solar } = require('lunar-javascript');
const Anthropic = require('@anthropic-ai/sdk').default;

const OHAENG_MAP = {
    '甲': '木', '乙': '木', '寅': '木', '卯': '木',
    '丙': '火', '丁': '火', '巳': '火', '午': '火',
    '庚': '金', '辛': '金', '申': '金', '酉': '金',
    '壬': '水', '癸': '水', '亥': '水', '子': '水',
    '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土'
};

// 사주 분석 공통 함수 — 연/월/일/시 8글자(천간+지지) 포함
function analyzeSaju(year, month, day, hour) {
    const calcHour = hour !== undefined ? hour : 12;
    const solar = Solar.fromYmdHms(year, month, day, calcHour, 0, 0);
    const bazi = solar.getLunar().getEightChar();

    const yearPillar  = bazi.getYear();   // 2글자: 천간+지지
    const monthPillar = bazi.getMonth();
    const dayPillar   = bazi.getDay();
    const hourPillar  = bazi.getTime();

    // 오행 계산: 시주는 시간 입력이 있을 때만 포함
    const activePillars = hour !== undefined
        ? [yearPillar, monthPillar, dayPillar, hourPillar]
        : [yearPillar, monthPillar, dayPillar];

    const ohaengCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    activePillars.forEach(p =>
        p.split('').forEach(char => { if (OHAENG_MAP[char]) ohaengCount[OHAENG_MAP[char]]++; })
    );

    return {
        mainEnergy: OHAENG_MAP[dayPillar[0]],
        ohaengCount,
        pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
        hasHour: hour !== undefined,
    };
}

// 궁합 로직: 서로의 부족한 기운을 채워주는지 계산
function checkCompatibility(dog, owner) {
    let score = 70; // 기본 점수

    // 주인의 mainEnergy가 강아지에게 필요한 기운(개수가 0인 것)일 때 점수 가산
    for (let energy in dog.ohaengCount) {
        if (dog.ohaengCount[energy] === 0 && owner.mainEnergy === energy) {
            score += 20; // 부족한 걸 주인이 채워줌!
        }
    }

    return {
        score: Math.min(score, 100),
        comment: score >= 90 ? "우리는 전생부터 이어진 찰떡궁합!" : "서로를 보완해주는 든든한 파트너!"
    };
}

// ─────────────────────────────────────────────
// 멍도사 AI 리포트 생성 (990 사주 벤치마킹)
// dogData   : analyzeSaju() 결과
// ownerData : analyzeSaju() 결과
// options   : { dogName, dogAge, ownerName }
// ─────────────────────────────────────────────
async function generateReport(dogData, ownerData, options = {}) {
    const { dogName = '우리 강아지', dogAge, ownerName = '주인님' } = options;
    const chemistry = checkCompatibility(dogData, ownerData);
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

    const p = dogData.pillars;
    const chartBlock =
`      연주  월주  일주  시주
천간    ${p.year[0]}     ${p.month[0]}     ${p.day[0]}     ${dogData.hasHour ? p.hour[0] : '-'}
지지    ${p.year[1]}     ${p.month[1]}     ${p.day[1]}     ${dogData.hasHour ? p.hour[1] : '-'}`;

    const ohaengDesc = (count) =>
        `木(활동) ${count['木']}개 · 火(열정) ${count['火']}개 · 土(안정) ${count['土']}개 · 金(의지) ${count['金']}개 · 水(지혜) ${count['水']}개`;

    const userMessage = `아래 데이터로 멍도사 990 스타일 리포트를 작성해줘.

[강아지]
- 이름: ${dogName}${dogAge !== undefined ? ` / 나이: ${dogAge}살` : ''}
- 일간(주기운): ${dogData.mainEnergy}
- 오행 분포: ${ohaengDesc(dogData.ohaengCount)}
- 8글자 차트:
${chartBlock}

[보호자]
- 이름: ${ownerName}
- 일간(주기운): ${ownerData.mainEnergy}
- 오행 분포: ${ohaengDesc(ownerData.ohaengCount)}

[궁합]
- 점수: ${chemistry.score}점 / ${chemistry.comment}`;

    const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        thinking: { type: 'adaptive' },
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
    });

    let report = '';
    process.stdout.write('\n🐾 멍도사 리포트 생성 중...\n\n');

    for await (const event of stream) {
        if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
        ) {
            process.stdout.write(event.delta.text);
            report += event.delta.text;
        }
    }

    process.stdout.write('\n');
    return report;
}

// ─────────────────────────────────────────────
// 실행 예시
// ─────────────────────────────────────────────
async function main() {
    // 강아지: 2015년 5월 10일생 (예시: 올해 약 11살)
    const dogData = analyzeSaju(2015, 11, 27);
    // 주인: 1990년 1월 1일생 (예시)
    const ownerData = analyzeSaju(1989, 8, 28, 22);

    const chemistry = checkCompatibility(dogData, ownerData);

    console.log("🐾 [강아지 기운]:", dogData.mainEnergy, dogData.ohaengCount);
    console.log("👤 [주인님 기운]:", ownerData.mainEnergy, ownerData.ohaengCount);
    console.log("💖 [우리의 궁합 점수]:", chemistry.score + "점");
    console.log("📝 [한줄평]:", chemistry.comment);

    // Claude API 리포트 생성
    await generateReport(dogData, ownerData, {
        dogName: '행운이',
        dogAge: 11,        // 11살 이상이면 노령견 건강 팁 자동 추가
        ownerName: '강다희',
    });
}

main().catch(err => {
    if (err.status === 401) {
        console.error('❌ API 키가 올바르지 않습니다. .env 파일의 ANTHROPIC_API_KEY를 확인해주세요.');
    } else {
        console.error('❌ 오류:', err.message);
    }
    process.exit(1);
});

module.exports = { analyzeSaju, checkCompatibility, generateReport };
