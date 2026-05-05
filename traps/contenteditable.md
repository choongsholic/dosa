# dosa contenteditable 함정 모음

dosa 보고서 템플릿(현재 `aqua-dashboard/`, 미래 다른 디자인 톤도 동일 적용)처럼 `<li contenteditable="plaintext-only">` + absolute 자식(컨트롤) + 한글 IME가 얽히는 ce 편집기를 만들 때 반복적으로 부딪힌 함정들. 같은 시행착오를 두 번 이상 겪고 정리.

ce 기반 인터랙션을 dosa 안에서 새로 만들거나 기존 구현(현재 `aqua-dashboard/dashboard.html`, `table.html`)을 손볼 때 먼저 읽고 시작.

---

## 1. Enter / Shift+Enter는 `keydown`에서, `beforeinput` 말 것

**증상**: `beforeinput`의 `insertParagraph`/`insertLineBreak`에서 `preventDefault` + DOM 조작하면 "Enter가 두 번 먹힌다 / 빈 점이 아래 줄에 생긴다" 반복 발생.

**원인**: WebKit의 plaintext-only가 `beforeinput.preventDefault()`를 일관되게 존중하지 않음 (특히 한글 IME 흐름에서). native가 자체 줄바꿈을 또 끼워넣음.

**해결**:
- 커스텀 동작은 `keydown`에서 `e.preventDefault()` + DOM 직접 조작
- `e.isComposing || e.keyCode === 229`로 IME 조합 중엔 패스
- `beforeinput`은 "다른 cell의 insertParagraph 단순 차단" 용도로만
- markdown 트리거(`- ` → bullet 등)는 `input` 이벤트에서 후처리

---

## 2. 한글 IME composition × dashboard 글로벌 핸들러 합작 → 2배 줄바꿈

**증상**: Shift+Enter가 어쩔 땐 1번, 어쩔 땐 2번 먹는 간헐 현상.

**원인**:
- 한글 composition 중 keydown은 `keyCode=229` 또는 `isComposing=true`로 발생
- 우리 핸들러가 `!e.isComposing`으로 skip하면 dashboard의 일반 `editable` Enter 핸들러가 그대로 실행되어 `<br>` 삽입
- 이후 commit된 두 번째 keydown(`isComposing=false`)에서 우리 핸들러가 또 `\n​` 삽입
- 합쳐서 **2배 줄바꿈**

**해결**: xt-desc / 비슷한 ce li에서 Enter는 **composition 여부 관계없이 무조건** `e.preventDefault() + e.stopImmediatePropagation()`. 그 *후에야* `isComposing/229`면 return (IME에 위임), 아니면 우리 로직 수행. 이렇게 해야 dashboard 핸들러가 절대 못 끼어듬.

```js
window.addEventListener('keydown', function (e) {
  var ae = document.activeElement;
  var li = ae && ae.closest && ae.closest('.xt-desc > li');
  if (!li) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.isComposing || e.keyCode === 229) return; // IME 위임
    if (e.shiftKey) { /* Shift+Enter: \n​ 삽입 */ }
    else            { /* 일반 Enter: 새 li */ }
  }
}, true); // window capture — document handler들보다 먼저 발화
```

`window.addEventListener` + capture phase가 핵심. `document` capture만으론 다른 document 리스너와 등록 순서에 따라 새는 경우 있음.

---

## 3. plaintext-only li 안의 `position: absolute` 자식 → Shift+Enter 시 라인 부풀림

**증상**: `<li contenteditable="plaintext-only">` 안에 `position: absolute; top: 50%` 자식(예: hover로 보이는 -/+ 컨트롤)이 있으면 Shift+Enter 1번에 li 높이가 1줄이 아니라 2-3줄씩 부풀음.

**원인**: Chrome plaintext-only ce가 list-item 디스플레이의 li에서 absolute 자식과 상호작용할 때 trailer/filler 라인을 누적시키는 듯. `position: absolute`가 flow에서 빠져 있는데도 라인 박스 계산에 영향을 줌.

**시도해봤지만 실패한 것들**:
- `<br>` 대신 `\n` + ZWSP 앵커 — 일부 개선되지만 잔존
- 구조 보정 (텍스트 노드 분할 회피) — 일부 개선
- native에 위임 (preventDefault 빼고) — dashboard handler가 합쳐져 더 악화

**유일한 확정 해결**: **편집 중 absolute 자식을 `display: none`으로 빼기**.

```css
.xt-desc li:focus .xt-desc-controls,
.xt-desc li:focus-within .xt-desc-controls {
  display: none !important;
}
```

편집 끝나면 다시 보이게. -/+ 컨트롤이 편집 중에도 보여야 한다는 UX 요구는 라인 부풀림 안정성과 직접 충돌 — 안정성을 택해야 함. 키보드(Enter = 새 li, 빈 li에서 Backspace = li 삭제)로 추가/삭제 대체 가능.

**예외**: outer 요소가 ce이고 inner li에는 컨트롤이 없는 구조(예: plan-table 셀)는 발생 안 함. **ce가 li 자체에 걸린 게 핵심 조건**.

---

## 4. `range.insertNode()`로 \n + ZWSP 따로 박지 말 것 — 단일 textNode 안에 문자열로

**증상**: Shift+Enter 처리 시 `range.insertNode(textNode("\n"))` + `insertBefore(zwsp, ...)` 패턴을 쓰면 caret 위치가 textNode 안일 때 split이 일어나 빈 textNode 잔존물이 생기고 → li 높이 부풀림 악화.

**해결**: 단일 textNode 안에 직접 문자열 삽입.

```js
var sc = range.startContainer, so = range.startOffset;
if (sc.nodeType === 3) {
  sc.textContent = sc.textContent.slice(0, so) + '\n​' + sc.textContent.slice(so);
  placeCaret(sc, so + 2);
}
```

backspace도 단일 textNode 내 검사:
```js
if (sc.nodeType === 3 && so >= 2 && sc.textContent.substring(so - 2, so) === '\n​') {
  sc.textContent = sc.textContent.slice(0, so - 2) + sc.textContent.slice(so);
  placeCaret(sc, so - 2);
}
```

---

## 5. ZWSP 앵커 없으면 빈 li에 caret 자체가 안 잡힘

**증상**: 새로 만든 빈 `<li contenteditable="plaintext-only">`를 focus시켜도 cursor가 안 보이고 텍스트 입력 자체가 안 됨.

**원인**: 빈 li + 비편집 absolute 자식만 있으면 caret이 떨어질 곳이 없음. plaintext-only ce는 텍스트 노드 앵커를 필요로 함.

**해결**: li 생성 시 ZWSP(`​`) 텍스트 노드를 controls span 앞에 박기.

```js
var li = document.createElement('li');
li.appendChild(document.createTextNode('​')); // ZWSP 앵커
li.appendChild(controlsSpan);
li.setAttribute('contenteditable', 'plaintext-only');
li.focus();
// caret을 ZWSP 끝(offset 1)에 명시적으로 배치
var range = document.createRange();
range.setStart(li.firstChild, li.firstChild.textContent.length);
range.collapse(true);
window.getSelection().removeAllRanges();
window.getSelection().addRange(range);
```

dashboard `focusForEditing` (line 2733)이 같은 패턴.

---

## 6. trailing `\n` / zwsp / `<br>` 청소 필수

**증상**: 편집 끝난 후에도 li 끝에 trailing `\n`/zwsp/`<br>`이 남으면 li 높이가 텍스트보다 한 줄 더 커짐 → 호버 outline이 텍스트보다 위/아래로 더 잡혀 "애매하게 틀어짐".

**해결**:
1. **endEdit/save 직전 trim**: li 끝(controls 제외)에서 trailing 제거
2. **페이지 로드 시 일괄 trim**: 기존 데이터 정상화
3. **커스텀 backspace 핸들러**: caret 직전 2글자가 `\n​`이면 둘 다 1번에 삭제

```js
function trimDescLiTrailing(li) {
  var ctrls = li.querySelector('.xt-desc-controls');
  for (var i = li.childNodes.length - 1; i >= 0; i--) {
    var n = li.childNodes[i];
    if (n === ctrls) continue;
    if (n.nodeType === 3) {
      n.textContent = n.textContent.replace(/[\s​]+$/, '');
      if (n.textContent === '') li.removeChild(n);
      else break;
    } else if (n.nodeType === 1 && n.tagName === 'BR') {
      li.removeChild(n);
    } else break;
  }
}
```

`focusout` 핸들러에서 호출. dashboard `trimDocBulletsLiTrailing` (line 2918)이 참고.

---

## 7. li에 `min-height: 0 !important` + `height: auto !important` 박지 말 것

**증상**: natural sizing 방해 → 라인 부풀림 더 악화.

**해결**: 그냥 빼고 자연 sizing에 맡기기. dashboard의 `.doc-bullets > li[contenteditable="plaintext-only"]`는 `min-height: calc(font-size × 1.45)`로 1줄 최소 높이 보장하는 패턴.

---

## 참고 구현

- `dashboard.html` — `trimDocBulletsLiTrailing` (line 2918), Backspace 핸들러 (line 3365), Shift+Enter 핸들러 (line 3221)
- `table.html` — `trimDescLiTrailing`, xt-desc Enter/Backspace 핸들러 (window capture phase)

---

## 8. IME composition × Shift+Enter — pendingCell + setTimeout race 패턴

**증상**: 한글 IME 중 Shift+Enter 누르면 셋 중 하나:
- (a) 글자 중복: `안녕` 친 직후 Shift+Enter 했더니 `안녕\n녕` 처럼 마지막 글자 재기록
- (b) 1회성 swallow: 첫 번째 Shift+Enter는 먹는데 다음부터 안 먹음
- (c) 2배 발화: 한 번 누른 게 두 줄 들어감

**원인**: Chrome 한글 IME가 Shift+Enter에 대해 keydown을 두 번 발화 (composition 진행 + 종료 후) + compositionend 사이에서 race.
- `keydown(229, isComposing=true)` — composition 진행 중. 이때 insert하면 IME가 composition 글자를 새 위치에 재기록 → 중복 (a).
- `compositionend` — composition 종료
- `keydown(13, isComposing=false)` — commit 후 keydown. (Chrome 항상 발화하지는 않음)

단순히 `if (isComposing) return`만 하면 (b). compositionend에서 처리하면 (c).

**해결 패턴** (`table.html:doShiftEnterForCell` + `pendingShiftEnterCell`):

```js
var pendingCell = null;
var lastInsertAt = 0;

function doInsert(cell) {
  // ... 실제 \n​ insert 로직
  lastInsertAt = Date.now();
}

window.addEventListener('keydown', function (e) {
  if (!(e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) || !e.shiftKey) return;
  var cell = findTargetCell(e);
  if (!cell) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (e.isComposing || e.keyCode === 229) {
    pendingCell = cell;     // composition 중 — 큐에 두기
    return;
  }
  // commit 후 keydown(13)이 들어왔다면 pending 흡수해서 처리 (compositionend setTimeout 무효화)
  if (pendingCell) {
    pendingCell = null;
    doInsert(cell);
    return;
  }
  // 직전 처리 후 ~120ms 안의 추가 keydown은 중복으로 보고 skip
  if (Date.now() - lastInsertAt < 120) return;
  doInsert(cell);
}, true);

document.addEventListener('compositionend', function () {
  if (!pendingCell) return;
  var cell = pendingCell;
  // 50ms 지연 — keydown(13)이 곧 와서 pending 흡수할 기회 줌. 안 오면 fallback으로 처리.
  setTimeout(function () {
    if (pendingCell !== cell) return; // keydown이 흡수했음
    pendingCell = null;
    if (!document.contains(cell)) return;
    doInsert(cell);
  }, 50);
}, true);
```

**핵심 4 포인트**:
1. **Enter 검출은 `e.key || e.code || e.keyCode`** — IME 중 `e.key`가 'Process'로 와도 잡힘
2. **isComposing이면 pendingCell 큐 + return** — 즉시 insert는 IME 재기록 유발
3. **commit-keydown(13)에서 pending 흡수** — compositionend setTimeout 차단
4. **120ms duplicate guard** — Chrome 추가 keydown 발화 케이스 방지

**왜 50ms?**: keydown(13) commit 후 발화는 보통 한 tick 안. 50ms면 충분히 대기. 너무 길면 사용자가 인지하는 lag.

---

## 9. user-mid-list (텍스트형 슬라이드 미드 li)에서 한글 IME Enter — composition 중 keyCode 229 보호

**증상**: 한글로 "안녕" 입력 후 Enter → 첫 li에 `\n` 한 줄 + 새 li 생성 (의도는 새 li만).

**원인**: 우리 `aeIsUML` 분기 조건이 `!e.isComposing && e.keyCode !== 229`. composition 중 Enter(IME confirm)는 keyCode 229 → 분기 false → 흐름이 글로벌 fallback `\n` 삽입 path까지 도달. 그 후 두 번째 (실제) Enter에서 새 li 생성.

**해결**: user-mid-list/ix-desc 같은 li 전용 컴포넌트는 글로벌 `\n` 삽입 path 진입 직전에 다시 한 번 검사 + skip:
```js
if (aeIsDB2 || aeIsPT2) return;
// composition 중 Enter도 \n 안 삽입 (한글 IME confirm은 native 처리)
if (aeIsUML) { e.preventDefault(); return; }
e.preventDefault();
// ... \n 삽입 ...
```

**규칙**: 새 li 컴포넌트 추가할 때 글로벌 Enter handler의 \n 삽입 path 직전에 명시적 skip 분기 박을 것. 분기 조건(`isComposing`/`keyCode 229`)이 false인 케이스도 fall-through 막아야.

---

## 10. 자식 li handler가 글로벌 keydown 차단하려면 stopPropagation + stopImmediatePropagation 둘 다

**증상**: li.addEventListener('keydown')에서 `e.stopImmediatePropagation()` 호출했는데 글로벌 document keydown handler가 그래도 발동.

**원인**: `stopImmediatePropagation`은 같은 element의 다른 listener만 차단. 다른 element(document)의 listener는 차단 못 함. `stopPropagation`이 propagation 자체를 막아야 document까지 안 올라감.

**해결**:
```js
li.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();          // document handler 차단
    e.stopImmediatePropagation(); // 같은 element 다른 listener 차단
    // ... 처리 ...
  }
});
```

**규칙**: 글로벌 keydown handler가 있는 환경에서 자식 element의 keydown handler가 단독 처리하려면 둘 다 호출. 하나만으론 부족.

---

## 11. base CSS의 `padding: ... !important`가 modifier 클래스의 padding을 가림

**증상**: `.ix-desc li.bullet { padding-left: 1.2em; }` 박았는데 텍스트와 bullet이 겹침. 들여쓰기 적용 안 됨.

**원인**: base 룰 `.ix-desc li { padding: 4px 0 !important; }`가 우선. specificity로는 `.ix-desc li.bullet`이 더 높지만 !important 충돌은 specificity가 결정 → 사실 `li.bullet` !important 없으면 base !important가 이김.

**해결**: modifier 룰에도 `!important` 박기. 또는 base 룰의 !important 제거.
```css
.ix-desc li.bullet { padding-left: 1.2em !important; }
```

**규칙**: base 룰에 `padding !important`가 있으면 modifier(state class)도 `!important`로 강제. 또는 base에서 !important 빼고 padding-left/right 분리.

---

## 12. user-added 슬라이드 outerHTML 복원 시 controls/listener 재부착

**증상**: localStorage에 outerHTML 저장 후 새로고침 → ix-block의 컨트롤바 click이 안 먹음. addDescLink click도 안 먹음.

**원인**:
- `ensureControls(frame)`가 `if (frame.querySelector('.ix-img-controls')) return`로 가드됨 → outerHTML에 controls 마크업이 남아있어서 새로 만들지 않음 → click handler 부착 skip
- addEventListener는 cloneNode/outerHTML로 복제 안 됨

**해결**:
1. **복원 직후 controls/handles 마크업 제거** — `newSlide.querySelectorAll('.ix-img-controls, .ix-resize-handle').forEach(el => el.remove())`. 그러면 ensureControls가 새로 만들면서 listener 부착.
2. **addDescLink click은 글로벌 위임** — local listener는 outerHTML에서 제거됨, 글로벌 `document.addEventListener('click', ...)`로 위임 패턴.

**규칙**: outerHTML 직렬화·복원 패턴에서 동적 listener는 무조건 사라진다는 가정. 복원 직후 명시적 init 호출 + listener 글로벌 위임 둘 다 안전망.

---

## 13. 인라인 편집 캐시(localStorage)가 외부 CSS를 덮어씀 — `!important`로 즉시 우회

**증상**: dashboard.html에서 일반 CSS 룰 변경이 시각적으로 적용 안 됨. 코드는 분명히 바꿨는데 브라우저가 옛 색·라운드를 그대로 보여줌.

**원인**: 이 파일은 인라인 편집 시스템(`dashboard-edits-v3` localStorage)을 쓰는데, 편집 시 브라우저 contenteditable이 자동으로 `style="color:..." / "border-radius:..."` 같은 인라인 스타일을 innerHTML에 박아넣고 저장한다. 페이지 로드 시 `applyStoredEdits()`가 stale innerHTML을 복원 → 인라인 style이 외부 CSS를 이김 → "분명 CSS 바꿨는데 안 바뀐다" 현상.

**해결**:
1. 사용자가 "안 바뀐다" / "왜 안 되냐" 신호 보내면 즉시 `!important` 추가하고 셀렉터 범위도 넓혀라
   ```css
   .cover-title, .cover-title * { color: var(--text) !important; }
   ```
2. 처음 한 번만 일반 CSS로 시도하고, 실패 보고 들어오면 추측·진단 길게 늘어놓지 말고 바로 `!important`
3. localStorage 초기화 안내(`localStorage.removeItem('dashboard-edits-v3')`)는 차선책 — 사용자의 누적 인라인 편집을 날리므로 마지막 수단
4. 새 dashboard.html 컴포넌트 만들 때부터 `!important`를 디폴트로 넣지는 말 것 (다른 페이지에선 일반 CSS로 충분)

**왜 중요한가**: 사용자가 cover-title accent 색 / badge-discuss border-radius 변경 시 여러 차례 막혀 큰 좌절 경험. `!important`로 풀자마자 "드디어 바뀐다" 반응. 진단 길게 끌지 말고 빠른 우회가 정석.

---

## 14. inline `font-size` + EDIT_KEY 락 — cmd+arrow가 안 먹는 원인

**증상**: 특정 element만 cmd+↑/↓ 폰트 사이즈 조절이 즉시 변하다가 새로고침하면 원래대로 돌아옴. 또는 아예 안 변하는 것처럼 보임.

**원인**: 마크업에 `style="font-size: 28px"` 같은 inline style + 같은 element에 `data-edit-id`. 흐름:
1. 사용자가 cmd+↑ 누름 → `adjustElementFontSize`가 inline style 새 값(`calc(...)`)으로 변경 → 즉시 변함
2. blur/endEdit → `saveEdit`가 EDIT_KEY[edit-id]에 fontSize 저장
3. **새로고침 시 `applyStoredEdits`가 EDIT_KEY 항목으로 inline style 다시 락** — 옛 값 박혀있으면 옛 값으로 돌아감
4. 또는 마크업의 원본 inline `28px`이 그대로 남아 매번 그 값으로 시작 → 사용자에겐 "안 변함"으로 보임

**해결**: 부모가 `font-size: calc(N * var(--font-scale))`로 사이즈 토큰 박고 있으면 자식 element는 **inline style 없이 상속**받게 둘 것. 자식이 cmd+↑ 누를 때 `el.style.fontSize`가 새로 박히고, EDIT_KEY에 저장되며, 새로고침 후에도 그 값으로 복원.

**규칙**: dosa 마크업에서 동일 부모 안 자식 group에 부모 사이즈 토큰만 있으면 충분 — 자식에 중복 inline `font-size`를 박지 말 것. 박혀있으면 cmd+arrow 동작 + 저장 흐름이 락에 갇힘.
