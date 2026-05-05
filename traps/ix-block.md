# ix-block (image+caption 컴포넌트) 슬라이드 통합 함정

dosa 슬라이드(`.slide-doc`) 안에 image 블록을 통합할 때 만난 JS/CSS 함정. 새 컴포넌트 만들거나 비슷한 패턴 작성 시 참고.

## 1. column 케이스(top/bottom/none)는 grid로

shell + textwrap이 같은 auto column track 공유 → textwrap이 자동으로 image width 따라감. flex + JS sync는 race 발생.

```css
.slide-doc > .ix-block[data-text-pos="bottom"] {
  display: grid !important;
  grid-template-columns: auto !important;
  grid-template-areas: "shell" "textwrap" !important;
  justify-content: center !important;   /* 그룹 수평 중앙 */
  align-content: center !important;     /* 그룹 수직 중앙 */
  row-gap: 12px !important;
}
.slide-doc .ix-block[data-text-pos="bottom"] > .ix-img-shell { grid-area: shell; }
.slide-doc .ix-block[data-text-pos="bottom"] > .ix-textwrap { grid-area: textwrap; }
```

shell의 `width: 100%` 제거 (grid track stretch가 처리). image inline width는 JS가 set → grid track = max-content.

## 2. left/right 케이스는 height 고정

```js
if (pos === 'left' || pos === 'right') {
  maxH = 300;           // height 고정
  maxW = maxH * naturalRatio;
  // cap 없음 — ResizeObserver가 layout 전환 중 일시적 small sh로 호출돼도 image 쪼그라들지 않게
}
```

`_userResized` 체크는 column 케이스에만 적용. left/right는 무조건 자동 300px.

## 3. closure stale 함정 (가장 골치아픈 버그)

**`update()` 함수 안에서 dataset attribute는 매번 다시 읽어야 함**. 외부 scope에 캐치하면 text-pos 변경 후 stale 값으로 동작 → 분기 진입 자체가 안 됨.

```js
// ❌ BAD
function syncImageToShell(frame, img) {
  var pos = block.dataset.textPos || 'none';  // closure로 잡힘
  function update() {
    if (pos === 'left' || pos === 'right') { ... }  // text-pos 바뀌어도 stale
  }
}

// ✅ GOOD
function syncImageToShell(frame, img) {
  function update() {
    var pos = block.dataset.textPos || 'none';  // 매 호출마다 다시 읽기
    if (pos === 'left' || pos === 'right') { ... }
  }
}
```

비슷하게 dataset에 의존하는 다른 함수도 외부 scope에 캐치하면 같은 위험.

## 4. scale 함정 (slidesWrapper transform: scale)

`slidesWrapper`에 `transform: scale(N)` 걸려 있어 viewport 픽셀 vs layout 픽셀이 다름:
- viewport(scaled): `getBoundingClientRect()`, `clientX/Y`, `pageX/Y`
- layout(unscaled): `clientWidth/Height`, `offsetWidth/Height`, `style.width`

둘을 섞으면 max 계산 같은 cap이 어긋남. 예: `dx = ev.clientX - startX`(viewport)와 `style.width = newW + 'px'`(layout)을 비교하면 scale 배만큼 어긋남 — 처음 사이즈 도달 못 함.

```js
// resize handle onMove 예시
var rectImg = img.getBoundingClientRect();
var SCALE = (img.offsetWidth && rectImg.width) ? (rectImg.width / img.offsetWidth) : 1;
var dx = (ev.clientX - startX) / SCALE;       // viewport → layout
var startWLayout = startW / SCALE;
// 이후 cap 계산은 clientWidth/Height (layout)로 통일
var maxWByWidth = Math.max(120, block.clientWidth);
```

update() 안에서 textwrap 높이도 `getBoundingClientRect().height` 대신 `textwrap.offsetHeight` 써야 layout 일관.

## 5. resize handle hMargin은 single-line 가정값

drag 중 hMargin을 현재 textwrap 측정값으로 계산하면 함정:
- image 줄임 → grid track 좁아짐 → caption multi-line → twH 커짐 → maxH 작아짐 → image 다시 못 키움 (caption이 자기 자신을 잠가버림)

```js
var minTwH = parseFloat(getComputedStyle(textwrap).minHeight) || 48;
var hMargin = minTwH + 12;  // single-line 가정 + grid row-gap
```

키우면 grid track 넓어지면서 caption single-line 회복하므로 minHeight 가정 OK.

## 6. ResizeObserver 대상은 block + shell만, textwrap은 X

textwrap을 관찰하면 width sync로 인한 height 변동이 update를 다시 부르는 cycle 발생. block + shell만 관찰. caption add/remove 같은 textwrap 변동은 외부에서 명시 호출 (`frame._updateImg()` 사용).

## 7. _userResized cap은 column 케이스에만

```js
if (img._userResized && pos !== 'left' && pos !== 'right') {
  var currentW = parseFloat(img.style.width) || 0;
  if (currentW > maxW + 0.5) {
    img.style.width = maxW + 'px';  // 사용자가 줄여도 contained max 초과면 cap (top 영역 늘어나서 mid 줄어들면 image overflow 방지)
    img.style.height = maxH + 'px';
  }
  return;
}
```

left/right는 항상 자동 300px 룰 적용 (사용자 manual size는 의미 없음 — row 레이아웃이라).

## 8. text-pos 전환 시 inline image size 리셋 + _userResized 해제

```js
if (b.dataset.pos) {
  block.dataset.textPos = b.dataset.pos;
  var img = block.querySelector('.ix-img');
  if (img) {
    img.style.width = '';
    img.style.height = '';
    img._userResized = false;
  }
  if (frame._updateImg) requestAnimationFrame(frame._updateImg);
}
```

column → row 전환 시 사용자가 column에서 줄여놨던 작은 사이즈가 row 레이아웃으로 그대로 들어가면 image 비정상.

## 9. 빈 placeholder는 grid 끄기

`.empty` shell 상태일 땐 column grid 룰 무효화 — placeholder가 ix-block 전체 폭 차지하도록.

```css
.slide-doc .ix-block:has(> .ix-img-shell.empty) {
  display: flex !important;
  flex-direction: column;
  align-items: center; justify-content: center;
}
.slide-doc .ix-block > .ix-img-shell.empty {
  width: 100%;
  max-width: min(480px, 60vmin);
  aspect-ratio: 1 / 1;
}
.ix-block:has(> .ix-img-shell.empty) > .ix-textwrap { display: none; }
```

## 10. wrap/unwrap 시 .animate 클래스 제거

ix-block을 stage로 wrap 또는 unwrap하면 element가 DOM에서 detach→reattach → 마크업의 `.animate` 클래스(fadeInUp 0.55s)가 재실행됨. wrap/unwrap 후:

```js
anchor.classList.remove('animate', 'delay-1', 'delay-2', ..., 'delay-8');
```

## 11. ix-desc 직렬화 — innerHTML 그대로 박지 말 것

`descUl.innerHTML`을 그대로 IX_STATE에 저장하면 **편집 인터랙션 잔재**가 박혀 다음 세션을 망가뜨림:

- `contenteditable="plaintext-only"` (편집 중 캡처되면 그대로 저장)
- `editable` class **누락된 li** (어떤 경로로든 클래스 잃은 li가 끼면 복원 후 click-to-edit 안 됨 → 사용자가 클릭/타이핑해도 아무 일도 안 일어남 → 새 입력 저장 안 됨 → 새로고침해도 같은 빈 블릿)
- 텍스트 없는 잔존 li (사용자에겐 빈 블릿만 덩그러니)

특히 **"빈 블릿이 영영 안 사라지는 좀비"** 증상이 이거: editable 없는 빈 li가 IX_STATE에 박혀 → 복원 → 클릭 안 먹음 → 사용자 입력이 어디에도 가지 않음.

```js
function serializeBlock(block) {
  var descUl = block.querySelector('.ix-desc');
  var descHtml = '';
  if (descUl) {
    var clone = descUl.cloneNode(true);
    clone.querySelectorAll('li').forEach(function (li) {
      li.removeAttribute('contenteditable');     // 인터랙션 상태 제거
      li.classList.add('editable');              // click-to-edit 보장
      var txt = (li.textContent || '').replace(/[\s​]/g, '');
      if (!txt && li.children.length === 0) li.remove();  // 빈 li 청소
    });
    descHtml = clone.innerHTML;
  }
  return { ..., descHtml: descHtml };
}
```

추가로 **레거시 corrupt 데이터 복구**: 이미 sanitize 없이 저장된 케이스는 restore 시점에도 같은 정리를 한 번 더 적용해야 좀비 블릿이 풀림. (DOM 복구 후엔 다음 사용자 편집 시 sanitized 버전으로 자동 덮어씀.)
