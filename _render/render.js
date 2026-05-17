#!/usr/bin/env node
/**
 * 도사 슬라이드 렌더러
 *
 * 사용법:
 *   node render.js <html-path> [out-dir]
 *
 * 입력 HTML 파일을 시스템 Chrome으로 열고 슬라이드별 PNG로 캡처한다.
 * out-dir 생략 시 입력 HTML 옆에 `_renders/` 폴더 생성.
 *
 * 산출:
 *   <out-dir>/slide-01.png ~ slide-NN.png  (라이트 모드)
 *
 * 옵션 (env var):
 *   DOSA_THEME=dark|light|both  — 어떤 테마로 캡처. 기본 'light'.
 *                                 'both'면 slide-01-light.png / slide-01-dark.png 분리 저장.
 *   DOSA_VIEWPORT=2040x1080      — 뷰포트 크기. 기본 베이스 캔버스.
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Chromium 못 찾음. 시스템에 Google Chrome 설치돼있는지 확인.');
}

async function captureSlides(htmlPath, outDir, theme) {
  const url = 'file://' + path.resolve(htmlPath);
  const [vw, vh] = (process.env.DOSA_VIEWPORT || '2040x1080').split('x').map(Number);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    defaultViewport: { width: vw, height: vh, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });

    // 폰트 로드 대기
    await page.evaluate(() => document.fonts.ready);

    // 테마 강제 적용
    await page.evaluate((t) => {
      document.documentElement.classList.remove('theme-light', 'theme-dark');
      document.documentElement.classList.add(`theme-${t}`);
    }, theme);

    // 슬라이드 총 개수
    const total = await page.evaluate(
      () => document.querySelectorAll('section.slide').length
    );
    console.log(`[render] ${theme} 모드 / ${total}장 / ${vw}x${vh}`);

    for (let i = 1; i <= total; i++) {
      // 슬라이드 N으로 점프 — base HTML이 노출하는 함수/입력 사용
      await page.evaluate((idx) => {
        if (typeof window.goToSlide === 'function') {
          window.goToSlide(idx - 1);
          return;
        }
        // fallback: slide-current input 사용
        const input = document.getElementById('slideCurrent');
        if (input) {
          input.value = String(idx);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
          );
          return;
        }
        // last fallback: opacity 직접 조작
        document.querySelectorAll('section.slide').forEach((s, k) => {
          s.style.opacity = k === idx - 1 ? '1' : '0';
          s.style.zIndex = k === idx - 1 ? '10' : '1';
          s.style.pointerEvents = k === idx - 1 ? 'auto' : 'none';
        });
      }, i);

      // 트랜지션·애니메이션 안정화 대기
      await new Promise((r) => setTimeout(r, 900));

      const idx = String(i).padStart(2, '0');
      const filename =
        theme === 'light' && process.env.DOSA_THEME !== 'both'
          ? `slide-${idx}.png`
          : `slide-${idx}-${theme}.png`;
      await page.screenshot({
        path: path.join(outDir, filename),
        clip: { x: 0, y: 0, width: vw, height: vh },
      });
      process.stdout.write(`  ${filename}\n`);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    console.error('사용법: node render.js <html-path> [out-dir]');
    process.exit(1);
  }
  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML 파일 없음: ${htmlPath}`);
    process.exit(1);
  }
  const outDir =
    process.argv[3] ||
    path.join(path.dirname(path.resolve(htmlPath)), '_renders');
  fs.mkdirSync(outDir, { recursive: true });

  const themeMode = process.env.DOSA_THEME || 'light';
  if (themeMode === 'both') {
    await captureSlides(htmlPath, outDir, 'light');
    await captureSlides(htmlPath, outDir, 'dark');
  } else {
    await captureSlides(htmlPath, outDir, themeMode);
  }

  console.log(`\n[done] ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
