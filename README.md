# my-service

Node.js + Express + TypeScript 기반 REST API 프로젝트

## 폴더 구조

```
my-service/
├── src/
│   ├── controllers/        # 요청 처리 로직
│   │   └── healthController.ts
│   ├── routes/             # 라우터 정의
│   │   └── index.ts
│   ├── middleware/         # 미들웨어
│   │   └── errorHandler.ts
│   ├── app.ts              # Express 앱 설정
│   └── server.ts           # 서버 진입점
├── dist/                   # 빌드 결과물 (자동 생성)
├── .env.example            # 환경변수 예시
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 설정합니다.

### 3. 실행 방법

#### 개발 모드 (hot reload)

```bash
npm run dev
```

#### 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

## API 엔드포인트

| Method | URL          | 설명            |
|--------|--------------|-----------------|
| GET    | /api/health  | 서버 상태 확인  |

### 예시 응답

```json
{
  "status": "ok",
  "timestamp": "2026-02-26T00:00:00.000Z"
}
```

## 기술 스택

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Dev Server**: ts-node-dev
