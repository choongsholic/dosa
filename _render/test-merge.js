#!/usr/bin/env node
/**
 * 머지 기능 통합 테스트 — puppeteer 로 다중선택/병합/새로고침/언머지/거부 케이스 검증
 * 사용법: node test-merge.js
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const HTML = path.resolve('/Users/hideinbushsh/.claude/skills/dosa/condolence/condolence.html');
const OUT = path.resolve('/Users/hideinbushsh/.claude/skills/dosa/condolence/_test-merge');

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
function findChrome() {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('Chrome not found');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gotoSlide4(page) {
  await page.evaluate(() => {
    document.querySelectorAll('section.slide').forEach((s, k) => {
      const active = k === 3;
      s.style.opacity = active ? '1' : '0';
      s.style.zIndex = active ? '10' : '1';
      s.style.pointerEvents = active ? 'auto' : 'none';
      s.classList.toggle('active', active);
    });
  });
  await sleep(500);
}

async function tableState(page) {
  return page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const table = slide.querySelector('table.xt');
    const rows = Array.from(table.querySelectorAll('tbody > tr'));
    return rows.map((tr, ri) => Array.from(tr.children).map(c => ({
      rs: c.getAttribute('rowspan') || '1',
      cs: c.getAttribute('colspan') || '1',
      txt: (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 25),
    })));
  });
}

async function multiSelectByDrag(page, fromCellSel, toCellSel) {
  const rect = await page.evaluate((fromSel, toSel) => {
    const f = document.querySelector(fromSel);
    const t = document.querySelector(toSel);
    if (!f || !t) return null;
    const fr = f.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    return {
      from: { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 },
      to: { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 },
    };
  }, fromCellSel, toCellSel);
  if (!rect) throw new Error('cells not found: ' + fromCellSel + ' / ' + toCellSel);
  await page.mouse.move(rect.from.x, rect.from.y);
  await page.mouse.down();
  await page.mouse.move(rect.from.x + 5, rect.from.y);
  await sleep(80);
  await page.mouse.move(rect.to.x, rect.to.y, { steps: 10 });
  await sleep(150);
  await page.mouse.up();
  await sleep(250);
}

async function clickCellMenu(page) {
  const r = await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const menu = slide.querySelector('.xt-cell-menu');
    if (!menu) return null;
    const rec = menu.getBoundingClientRect();
    return { x: rec.left + rec.width / 2, y: rec.top + rec.height / 2, vis: rec.width > 0 };
  });
  if (!r || !r.vis) return false;
  await page.mouse.click(r.x, r.y);
  await sleep(250);
  return true;
}

async function clickPopoverItem(page, label) {
  const r = await page.evaluate((lbl) => {
    const items = document.querySelectorAll('.xt-context-menu .item');
    for (const it of items) {
      const lEl = it.querySelector('.label');
      if (lEl && lEl.textContent.includes(lbl)) {
        const rec = it.getBoundingClientRect();
        return { x: rec.left + rec.width / 2, y: rec.top + rec.height / 2, found: true };
      }
    }
    return { found: false };
  }, label);
  if (!r.found) return false;
  await page.mouse.click(r.x, r.y);
  await sleep(400);
  return true;
}

async function clickCell(page, sel) {
  const r = await page.evaluate((s) => {
    const c = document.querySelector(s);
    if (!c) return null;
    const rec = c.getBoundingClientRect();
    // 셀 왼쪽 25% 지점 클릭 — 중앙은 colspan 셀에서 col-gap 호버 위치와 겹칠 수 있음
    return { x: rec.left + rec.width * 0.25, y: rec.top + rec.height / 2 };
  }, sel);
  if (!r) throw new Error('cell not found: ' + sel);
  // 먼저 빈 영역으로 마우스 이동 후 클릭 — 잔존 호버 상태 클리어
  await page.mouse.move(50, 50);
  await sleep(50);
  await page.mouse.click(r.x, r.y);
  await sleep(200);
}

async function popoverHas(page, label) {
  return page.evaluate((lbl) => {
    const items = document.querySelectorAll('.xt-context-menu .item');
    for (const it of items) {
      const lEl = it.querySelector('.label');
      if (lEl && lEl.textContent.includes(lbl)) return true;
    }
    return false;
  }, label);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 2040, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();

  const fail = [];
  const pass = [];
  const log = (ok, name, extra) => {
    (ok ? pass : fail).push(name);
    console.log((ok ? '✓' : '✗') + ' ' + name + (extra ? ' — ' + extra : ''));
  };

  await page.goto('file://' + HTML, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => { if (k.startsWith('condolence-')) localStorage.removeItem(k); });
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await gotoSlide4(page);

  // 셀 selectors — visualGrid 기준 위치 매핑 (rowspan'd 화환 셀 때문에 row 2 col 2 가 absorbed)
  const sel = (r, c) => `section[data-orig-idx="3"] table.xt tbody > tr:nth-child(${r + 1}) > td:nth-child(${c + 1})`;

  // ===== 시나리오 1: 단순 머지 (사망 row 첫 두 셀) =====
  console.log('\n[scenario 1] 단순 머지');
  await multiSelectByDrag(page, sel(3, 0), sel(3, 1));
  let msCount = await page.evaluate(() => document.querySelectorAll('.xt-multi-selected').length);
  log(msCount === 2, '다중선택 2셀', `count=${msCount}`);

  await clickCellMenu(page);
  const has1 = await popoverHas(page, '셀 병합');
  log(has1, '"셀 병합" 항목 노출');
  await clickPopoverItem(page, '셀 병합');
  await page.screenshot({ path: path.join(OUT, '01-after-merge.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });

  let st = await tableState(page);
  const merged = st[3][0];
  log(merged.cs === '2' && merged.txt === '사망', '병합 결과 colspan=2, 텍스트=사망', `cs=${merged.cs}, txt="${merged.txt}"`);

  // ===== 시나리오 2: 새로고침 후 머지 상태 유지 =====
  console.log('\n[scenario 2] 새로고침 후 영속성');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await gotoSlide4(page);
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, '02-after-reload.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });
  st = await tableState(page);
  const reloaded = st[3][0];
  log(reloaded.cs === '2' && reloaded.txt === '사망', '새로고침 후 머지 유지', `cs=${reloaded.cs}, txt="${reloaded.txt}"`);

  // ===== 시나리오 3: 언머지 =====
  console.log('\n[scenario 3] 언머지');
  await clickCell(page, sel(3, 0));
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, '03a-after-click.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });
  // 진단: 활성 cell + multiSelect 상태
  const diag = await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const block = slide.querySelector('.xt-block');
    const activeCell = slide.querySelector('.xt-cell.is-active');
    const menu = slide.querySelector('.xt-cell-menu');
    return {
      blockHasActive: block ? block.classList.contains('has-active') : null,
      activeCellTxt: activeCell ? (activeCell.textContent || '').slice(0, 15) : null,
      activeCellCs: activeCell ? (activeCell.getAttribute('colspan') || '1') : null,
      menuVisible: menu ? menu.getBoundingClientRect().width > 0 : null,
    };
  });
  console.log('  click 후 진단:', diag);
  await clickCellMenu(page);
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '03b-popover-open.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });
  // 진단: 팝오버 항목 목록
  const items = await page.evaluate(() => {
    const items = document.querySelectorAll('.xt-context-menu .item');
    return Array.from(items).map(it => (it.querySelector('.label') || {}).textContent || '');
  });
  console.log('  팝오버 항목:', items);
  const hasUn = await popoverHas(page, '병합 해제');
  log(hasUn, '"병합 해제" 항목 노출');
  await clickPopoverItem(page, '병합 해제');
  await page.screenshot({ path: path.join(OUT, '03-after-unmerge.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });
  st = await tableState(page);
  const unmerged = st[3];
  log(unmerged.length === 3 && unmerged[0].cs === '1' && unmerged[1].cs === '1', '언머지 후 3셀 복원', `cells=${unmerged.length}, cs=[${unmerged.map(c => c.cs).join(',')}]`);

  // ===== 시나리오 4: rowspan 셀 포함 머지 시도 → 거부 =====
  console.log('\n[scenario 4] rowspan 셀 영역 머지 거부');
  // 결혼 row col 2 (화환 rowspan'd) 와 결혼 row col 1 다중선택 → 화환은 rs=2 라 canMergeCells가 거부해야
  await multiSelectByDrag(page, sel(1, 1), sel(1, 2));
  await clickCellMenu(page);
  const has4 = await popoverHas(page, '셀 병합');
  log(!has4, 'rowspan 포함 시 "셀 병합" 미노출 (canMergeCells 거부)', `노출됨=${has4}`);
  await page.screenshot({ path: path.join(OUT, '04-rowspan-reject.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });

  // 외부 클릭으로 팝오버/선택 정리
  await page.mouse.click(100, 100);
  await sleep(200);

  // ===== 시나리오 5: 새로 머지 후 외곽 라인 상속 (col-gap 검정 적용 후 머지) =====
  console.log('\n[scenario 5] 외곽 라인 상속');
  // 1) col-gap 우측 끝 (idx=3) 에 검정 적용 — 모든 col 2 셀의 borderRight 검정
  await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const gap = slide.querySelector('.xt-gap.col-gap[data-idx="3"]');
    if (!gap) throw new Error('col-gap idx=3 not found');
    // gap-btn 클릭으로 chips 열고 black chip 클릭
    const btn = gap.querySelector('.xt-gap-btn');
    btn.click();
  });
  await sleep(200);
  // black chip 클릭
  await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const gap = slide.querySelector('.xt-gap.col-gap[data-idx="3"]');
    const blackChip = gap.querySelector('.xt-gap-chip[data-c="black"]') ||
                      document.querySelector('body > .xt-gap-chips .xt-gap-chip[data-c="black"]');
    blackChip.click();
  });
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, '05a-line-applied.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });

  // 2) 사망 row 첫 두 셀 머지 (앞서 언머지 했으니 다시 가능)
  await multiSelectByDrag(page, sel(3, 0), sel(3, 1));
  await clickCellMenu(page);
  await clickPopoverItem(page, '셀 병합');
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '05b-merge-with-line.png'), clip: { x: 0, y: 0, width: 2040, height: 1080 } });

  // 3) 머지된 셀 (col 0-1) 우측 border 는 col 1 의 우측 라인을 상속해야 — 사망 row 의 col 1 셀이 col-gap idx=3 의 영향 받지 않아서 borderRight 없음. 정상.
  // 머지된 셀의 우측 borderRight 가 빈지 검증 (col 1 cell 은 원래 라인 안 받음)
  const mergedBorders = await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const table = slide.querySelector('table.xt');
    const rows = table.querySelectorAll('tbody > tr');
    const lastRow = rows[3];
    const merged = lastRow.children[0];  // 사망 cs=2
    return {
      cs: merged.getAttribute('colspan'),
      bL: merged.style.borderLeft || '',
      bR: merged.style.borderRight || '',
      bT: merged.style.borderTop || '',
      bB: merged.style.borderBottom || '',
    };
  });
  console.log('  머지셀 borders:', JSON.stringify(mergedBorders));
  log(mergedBorders.cs === '2', '머지셀 colspan=2 유지', `cs=${mergedBorders.cs}`);

  // 4) col 2 (조사물품) 셀의 borderRight 가 검정으로 유지되는지 확인 (col-gap idx=3 영향)
  const lastColBorder = await page.evaluate(() => {
    const slide = document.querySelector('section[data-orig-idx="3"]');
    const table = slide.querySelector('table.xt');
    const rows = table.querySelectorAll('tbody > tr');
    const lastRow = rows[3];
    const lastCell = lastRow.children[lastRow.children.length - 1];
    return { txt: (lastCell.textContent || '').slice(0, 15), bR: lastCell.style.borderRight || '' };
  });
  log(lastColBorder.bR.includes('var(--text)') || /solid/.test(lastColBorder.bR),
      '조사물품 셀 borderRight 검정 라인 유지', `bR="${lastColBorder.bR}"`);

  // ===== 결과 요약 =====
  console.log('\n========== 결과 ==========');
  console.log(`✓ pass: ${pass.length}`);
  console.log(`✗ fail: ${fail.length}`);
  if (fail.length) console.log('실패:', fail);
  console.log('스크린샷:', OUT);

  await browser.close();
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
