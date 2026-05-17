# 도사 렌더러 (`_render/`)

도사 작업물(HTML)을 슬라이드별 PNG로 캡처. 시각 검수(`traps/visual-verification.md`) 단계에서 사용.

## 사전 준비 (다른 컴퓨터에서 처음 풀한 후 1회)

```bash
cd ~/.claude/skills/dosa/_render
npm install
```

## 사용

```bash
node render.js <html-path> [out-dir]
```

예:
```bash
node ~/.claude/skills/dosa/_render/render.js ~/Documents/DOSA/condolence/condolence.html
# → ~/Documents/DOSA/condolence/_renders/slide-01.png ~ slide-NN.png 생성
```

## 옵션 (env var)

- `DOSA_THEME=light|dark|both` — 어떤 테마로 캡처 (기본 `light`)
- `DOSA_VIEWPORT=2040x1080` — 뷰포트 크기 (기본 베이스 캔버스)

```bash
DOSA_THEME=both node render.js ./condolence.html
# → slide-01-light.png / slide-01-dark.png 양쪽 다 캡처
```

## 의존성

- 시스템 Chrome (`/Applications/Google Chrome.app`) 또는 Chromium / Edge
- Node 18+
- `puppeteer-core` (이 폴더에서 `npm install` 후 사용)

`node_modules`는 git 추적 X (`.gitignore`).
