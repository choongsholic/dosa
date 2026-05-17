# dosa export 함정 — 굽기 / 내보내기 / 공유 모드

dosa 보고서 템플릿이 두 가지 export 흐름을 가질 때 발생하는 함정. 굽기(작업본 보존, 편집 가능), 내보내기(공유본, 편집 불가)가 다른 운영 정책을 따르므로 각자의 청소 / 마커 / 동적 분기 룰을 둬야 한다.

새 디자인 톤이나 다른 템플릿에 같은 export 패턴 도입할 때 먼저 읽고 시작.

## 1. `[contenteditable="true"]`만 청소하면 plaintext-only가 살아남음

```js
// ❌ BAD — true만 잡음
clone.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));

// ✅ GOOD — 모든 형태 (true, plaintext-only, false) 청소
clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
```

dosa 편집 모드는 보통 `contenteditable="plaintext-only"` 박아쓰는데, 굽기 함수가 `="true"`만 청소하면 잔재 attribute가 누적됨. 굽힌 파일을 다시 열면 어떤 element는 페이지 로드 직후 편집 가능 상태로 시작.

`[contenteditable]`은 **속성이 존재하는 모든 element**를 잡는 attribute selector라 값과 무관하게 다 청소. 굽기·내보내기 둘 다 적용.

## 2. 굽기와 내보내기 — 정책이 다르다

| | 굽기 (export) | 내보내기 (export-share) |
|---|---|---|
| 목적 | 작업본 백업·동기화 | 외부 공유용 |
| 편집 인터랙션 | **유지** (다음에 이어 편집) | **제거** |
| `.editable` 클래스 | 유지 | 제거 |
| `data-edit-id` | 유지 | 제거 |
| `contenteditable` 잔재 | 청소 (#1) | 청소 |
| `.bullet-controls`, `.xt-add-title`, `.xt-cell-menu` 등 컨트롤 | 유지 | **통째 제거** |
| `.ix-block-actions`, `.ix-add-desc-link`, `.ix-file-input` | 유지 | 제거 |
| `#overview-add-page`, `#overview-add-popup` | 유지 | 제거 |
| 굽기/내보내기 버튼 자체 (`.ctrl-export-row`) | 유지 | 제거 |
| 파일명 | `dashboard.html` (덮어쓰기) | `dashboard-export.html` |
| 마커 클래스 | 없음 | `<html class="share-mode">` |

내보내기 시 컨트롤 element 통째 제거 + `.editable`/`data-edit-id`/`contenteditable` 청소를 동시에. 일부만 하면 어딘가 클릭이 살아남음.

## 3. 정적 청소만으론 부족 — 동적 빌드 함수도 share-mode 분기 필요

`buildOverview()` 같은 함수가 페이지 로드/패널 토글 시 매번 trash 버튼·drag handle을 동적으로 박는다. 내보내기 export로 정적 마크업에서 trash를 제거해도, 받는 사람이 오버뷰 패널을 열면 buildOverview가 다시 그려서 trash가 살아남.

```js
// 동적 빌드 함수 안에 share-mode 가드
if (!document.documentElement.classList.contains('share-mode')) {
  // trash 버튼 / drag handle / + 버튼 등 편집 트리거 박기
}
item.draggable = !document.documentElement.classList.contains('share-mode');
```

내보내기 함수에서 root html에 `share-mode` 클래스 박은 다음, **동적 빌드/리빌드 함수 내부에서 일일이 이 클래스 체크**해야 완전 차단. CSS `display:none`만으론 drag 같은 인터랙션을 막을 수 없음.

## 4. 굽기 함수 fix는 새로고침 후에야 적용

함수를 코드로 수정해도 사용자 브라우저 메모리엔 옛 함수가 남아있다. 사용자가 굽기 버튼 누르면 옛 함수가 동작 → 잔재 그대로.

**룰**: 굽기 함수를 수정한 후 사용자에게 안내할 것 — "탭 닫고 다시 열기 (또는 hard reload) → 굽기". cmd+R 일반 reload는 file:// 환경이라도 함수 갱신을 보장 못 할 수 있으니, 탭 새로 열기가 가장 안전.

## 5. 폰트 — 베이스 템플릿에 base64 인라인 (작업본·share 모두 self-contained)

`dosa-base/dashboard.html` 베이스 템플릿의 `<head>` 첫 `<style>` 안 `@font-face` `src`가 base64 data URL로 박혀 있음. 작업본 cp나 share export 모두 자동으로 폰트 포함.

```css
@font-face { font-family: 'SFProDisplay'; src: url('data:font/woff2;base64,...') format('woff2'); font-weight: 400 500; font-display: swap; }
@font-face { font-family: 'SFProDisplay'; src: url('data:font/woff2;base64,...') format('woff2'); font-weight: 600 800; font-display: swap; }
@font-face { font-family: 'YouandiNewKrTitle'; src: url('data:font/woff2;base64,...') format('woff2'); font-weight: 700; font-display: swap; }
```

이유:
- file:// 환경에선 JS `fetch`/XHR가 막혀 export 시점에 폰트 읽기 불가 (Chrome 정책). 미리 박는 게 유일한 self-contained 해법.
- 외부 CDN 의존 X. 현대카드 `img.hyundaicard.com/.../font.css`는 외부에서 죽음 (302 → error). Netlify/Vercel/jsDelivr도 추가 운영 부담 + 인터넷 의존.
- 받는 사람은 HTML 한 파일만 받고 더블클릭. 인터넷 끊겨도 폰트 OK.

함정:
- **weight range 필수**: SF Pro Bold 한 파일을 weight 600/700/800에 다 쓰는데, `@font-face` 3개로 분리하면 base64 문자열이 3중 중복돼 파일 사이즈 폭발 (4MB → 26MB 사고남). `font-weight: 600 800;` range로 한 번만 박아 13MB로 억제.
- 베이스 템플릿 사이즈 ~13MB. cp로 만든 작업본도 ~13MB. 하드디스크에 누적될 수 있으니 `archive/` 도입 검토 (SKILL.md §3 참고).
- 폰트 갱신 시 `~/.claude/skills/dosa/fonts/` 안 woff2 갱신 + 베이스 템플릿 재인코딩 필요. `python3` 한 번에 base64 갱신 가능.
- Hackathon 프로젝트는 별도 폴더 호스팅이라 `assets/fonts/` 상대 참조로 충분. dosa는 단일 파일 공유 시나리오라 인라인이 맞다.

### 5-1. 첫 슬라이드 깜빡임 (showSlide(0) 재트리거 경합)

13MB 인라인 환경에서 페이지 로드 직후 `showSlide(0)`의 `.animate` 재트리거(`style.animation = 'none' → reflow → ''`)가 무거운 렌더와 경합해 자식 요소들이 opacity:0에 stuck되는 사례 발견. 다음 슬라이드 갔다오면 정상 재트리거됨.

해결: `_hasShownBefore` 플래그로 **첫 showSlide 호출엔 재트리거 skip** — 초기 `.animate`는 CSS 클래스 룰로 자연스럽게 한번만 흐르도록. 두 번째 호출부터 재트리거 정상 동작.

```js
var _hasShownBefore = false;
function showSlide(idx) {
  // ... active 토글 등 ...
  if (_hasShownBefore) {
    var animEls = slides[idx].querySelectorAll('.animate');
    animEls.forEach(function (el) { el.style.animation = 'none'; void el.offsetHeight; el.style.animation = ''; });
  }
  _hasShownBefore = true;
}
```

이 패턴은 폰트 base64 인라인이 도입된 후 발생. 작은 파일(4MB)에선 재현 안 됐음.

### 5-2. 베이스 템플릿 재인코딩 스크립트 예시:
```python
import base64
font_dir = '~/.claude/skills/dosa/fonts'
def b64(name): return base64.b64encode(open(f'{font_dir}/{name}', 'rb').read()).decode()
# 위 3개 @font-face의 data URL을 갱신된 b64로 교체
```

## 6. 굽기 시 오버뷰 패널 열려있으면 `body.overview-active`가 박혀 hover 전부 죽음

**증상**: 굽기 후 결과 파일 열면 텍스트 hover가 어디서도 안 떠서 인라인 편집이 죽은 듯 보임. 모든 `.editable`이 `cursor: default; pointer-events: none !important` 상태.

**원인**: 굽기는 `document.documentElement.cloneNode(true)`로 현재 DOM을 그대로 복제·저장. 사용자가 오버뷰 패널 열어둔 채 굽기 누르면 `<body class="overview-active">`가 그대로 박힘. CSS 룰:

```css
body.overview-active .editable { cursor: default; pointer-events: none !important; }
```

이 룰이 모든 페이지의 모든 편집 가능 element에 적용 → hover 전체 사망.

**해결** (두 겹 방어):
```js
function exportHTML() {
  // 1. clone 전에 오버뷰 닫기 — 사용자에게 시각적 피드백 + DOM 정리
  if (typeof closeOverview === 'function') closeOverview();

  var clone = document.documentElement.cloneNode(true);
  // ... 기타 청소 ...

  // 2. clone에서 직접 한 번 더 제거 — animation timing으로 클래스 잔존 시 안전망
  var bodyEl = clone.querySelector('body');
  if (bodyEl) bodyEl.classList.remove('overview-active');

  // ... blob/download ...
}
```

`exportShareHTML`에도 동일 적용. 같은 함정이 다른 stateful body 클래스에서도 재현 가능 — clone 전에 transient 상태 정리하는 게 정석.

## 7. 정적 마크업의 `.ix-img-controls` 때문에 click handler 안 부착

**증상**: 굽기로 만든 작업본을 다시 열면 일부 페이지(이미지 있는 슬라이드)의 toolbar hover는 보이는데 클릭이 작동 안 함. 다른 페이지는 정상.

**원인**: `ensureControls(frame)` 함수 내부:

```js
function ensureControls(frame) {
  if (frame.querySelector('.ix-img-controls')) return;  // ← 여기!
  // 새 controls 생성 + click handler 부착
}
```

굽기는 현재 DOM 상태(toolbar 마크업 포함)를 그대로 저장. 다시 열면 `.ix-img-controls` element가 이미 정적 HTML에 있음. `initIxBlock` → `ensureControls` 호출 → element 있으니 early return → **click handler 부착 안 됨**.

**해결**: ensureControls 호출 직전에 기존 controls/handles 제거

```js
function initIxBlock(block) {
  // ...
  var preFrame = shell.querySelector('.ix-img-frame');
  if (preFrame) {
    // outerHTML에 박힌 controls/handles 제거 — early return 회피
    preFrame.querySelectorAll('.ix-img-controls, .ix-resize-handle').forEach(function (el) { el.remove(); });
    ensureControls(preFrame);
    ensureResizeHandles(preFrame);
  }
}
```

`restoreUserSlides`(line 8664)에서 같은 fix가 이미 있던 패턴 — `initIxBlock`에도 적용. **early-return guard가 있는 init 함수는 정적 마크업 잔재 때문에 미동작 가능**. 동일 패턴이 `ensureResizeHandles` 등 다른 함수에도 있으면 같이 처리.

## 8. 카운트 디버그 함정 — CSS selector vs HTML attribute

`grep -c 'contenteditable='` 같은 단순 grep은 **CSS selector** (예: `[contenteditable="plaintext-only"]`), **JS 문자열** (예: `el.setAttribute('contenteditable', ...)`), **HTML attribute** 셋 다 잡는다. 굽기 청소 검증 시 grep 카운트로 판단하면 마크업이 깨끗한데도 잔재가 있다고 오판하기 쉬움.

진짜 attribute로 박힌 것만 카운트:

```bash
# element 시작 태그 안의 attribute만 잡기
grep -cE '<[a-z][^>]*contenteditable=' file.html
```

또는 검증용으로:

```bash
grep -oE 'contenteditable="[^"]*"' file.html | sort | uniq -c
```

이 결과는 selector·문자열·attribute 다 섞여 있어 카운트만으로 판단 X. 실제 마크업 위치 (line 번호 + 컨텍스트) 봐야 함.
