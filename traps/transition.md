# dosa 트랜지션 함정 모음

리스트 항목 추가/제거 트랜지션, 같은 클래스 element 간 동작 변동성 등 트랜지션·상태 관련 시행착오. 새 인터랙션 만들 때 먼저 읽고 시작.

---

## 1. 리스트 항목 추가 — 클릭 즉시 등장 + 아래 콘텐츠 부드럽게 밀림

li 추가 시 사용자가 원한 동작: **클릭 즉시 li 전체(녹색 박스, bullet, 컨트롤, 커서)가 최종 위치에 등장 + 아래 콘텐츠는 부드럽게 밀려남**. 만들면서 부딪힌 함정 4종.

### 1.1 li max-height 트랜지션은 li 내부도 같이 grow → "위에서 아래로 등장"

**증상**: `max-height: 0 → newH` + `overflow: hidden` 조합이 layout 임팩트는 부드럽게 만들지만, li 내부 요소(box-shadow, ::before bullet, position:absolute 컨트롤)도 같이 클립되며 "내려오면서 등장"으로 보임.

**해결**: li 자체엔 entering 트랜지션 안 줌 (즉시 풀 사이즈로 삽입). 아래 콘텐츠를 별도로 트랜지션.

### 1.2 ul.maxHeight 트랜지션은 flex 재분배로 이미지 매 프레임 리스케일 → jitter

**증상**: ul.maxHeight를 oldH → newH로 transition하면, slide 내 flex:1 형제(image-wrap)가 매 프레임 재분배 → 이미지 object-fit 재계산 → "틱틱" jitter.

**해결**: ul 트랜지션 폐기. 대신 ul 다음 형제들에 `transform: translateY`로 위치만 슬라이드 (이미지 사이즈는 즉시 NEW로 고정, GPU 트랜지션이라 부드러움).

### 1.3 `.animate { animation: fadeInUp ... both }`이 inline transform을 owning → 트랜지션 무시

**증상**: `.animate` 클래스의 fadeInUp은 fill-mode: both로 end-state(transform: none)을 유지. CSS animation은 일반 inline 변경을 owning → `style.transform = '...'` 바뀌어도 animation 값이 우선 적용되어 트랜지션 안 보임.

**해결**: **Web Animations API (`element.animate()`)** 사용. CSS cascade를 우회해서 적용됨. `fill: 'none'`이라 끝나면 자연 상태로 깔끔히 복귀.

### 1.4 doc-image-wrap의 image는 translateY만으론 어색 ("촐싹거리며 빨리")

**증상**: 이미지가 NEW(작은) 크기로 즉시 변한 채 위치만 슬라이드되면 "이미 작아진 게 그냥 미끄러지는" 느낌.

**해결**: img에 `transform: scale(s)` (transformOrigin: center bottom)로 트랜지션. `s = oldImgH / newImgH (>1)`. bottom 고정, top edge가 자연스럽게 내려옴. 사이즈와 위치가 동시에 변화.

### 적용 패턴 (FLIP + Web Animations)

```js
// captureXxx(slide): 변경 직전, ul/title 다음 형제들의 oldTop 캡처
//   doc-image-wrap이면 내부 img.height도 캡처
// smoothXxx(slide): 변경 직후, sibling별로 dy = oldTop - newTop 계산
//   - 일반 sibling → translateY(dy) → translateY(0) Web Animations
//   - doc-image-wrap → 내부 img scale(oldImgH/newImgH, origin: center bottom) → scale(1) Web Animations
```

### 적용 규칙
- "클릭 즉시 등장 + 아래 부드럽게 밀림" 요구 → li 자체 트랜지션 X, 아래 콘텐츠를 FLIP 패턴
- CSS animation이 transform을 owning하는 케이스(`.animate` 클래스 등) → 반드시 Web Animations API. `setProperty(..., 'important')`도 transition은 못 살림
- 트랜지션 동안 layout 트리거 속성(height, max-height) 변경은 이미지 리스케일 jitter 유발 → transform/opacity 같은 GPU compositing 프로퍼티만 사용

---

## 2. 리스트 항목 제거 — "지이잉틱틱"의 3대 원인

li 제거 시 max-height만 트랜지션하면 "지이잉틱틱" 현상이 생긴다. 끝까지 부드럽게("지이잉") 만들려면 다음 3가지 snap을 모두 처리해야 한다.

### 2.1 contenteditable=plaintext-only의 min-height 룰 소실 snap

**증상**: `endEdit`에서 `contenteditable='false'`로 바꾸면 `[contenteditable="plaintext-only"] { min-height: ... }` 룰이 즉각 사라지면서 li가 미리 살짝 줄어듦.

**해결**: contenteditable 바꾸기 전에 `getBoundingClientRect().height` 캡처해서 인라인 `height`/`min-height`로 잠금.

### 2.2 flex `gap`은 negative margin으로 absorb 안 됨

**증상**: `.parent { display: flex; gap: 6px }`에서 자식에 `margin: -3px`을 줘도 gap은 그대로 → li 제거 시 6px이 한 번에 collapse.

**해결**: `gap`을 제거하고 `> li + li { margin-top: 6px }`로 변환 → margin-top을 트랜지션 가능.

### 2.3 부모 ul이 함께 제거되는 케이스 (마지막 li 제거 시)

**증상**:
- ul의 `margin-top` + `margin-bottom`이 ul.remove() 시점에 한꺼번에 사라짐
- ul 다음 형제(예: title-add-list)의 margin이 sibling 변화로 snap (`.doc-title + .title-add-list { margin-top: 16px }`처럼 :nth-child류 selector가 새로 매칭됨)

**해결**:
- `animateLiOut`에서 `ul.children.length === 1`이면 ul과 ul의 다음 형제도 동시 트랜지션
- `.doc-bullets:has(+ .title-add-list) { margin-bottom: 6px !important }` 같은 !important 룰을 이기려면 `el.style.setProperty('margin-bottom', '0px', 'important')` 써야 함

### 적용 규칙
- li/항목 제거 트랜지션에서 "끝에서 끊김" 보고 받으면 transition 자체가 아니라 "transition 외 layout 변화"부터 의심
- 부모가 flex container면 `gap` 사용 여부 먼저 체크 → margin-on-items로 변환 검토
- 마지막 자식 제거 케이스를 별도로 처리 (부모 + 그 다음 sibling까지 동기 트랜지션)
- `!important` CSS 룰을 inline으로 덮어쓸 땐 `setProperty(..., 'important')` 사용

---

## 3. 같은 클래스 element가 들쭉날쭉 동작 → 상태부터 의심

**증상**: 같은 selector를 공유하는 element들 중 일부만 정상, 일부는 버그. "어떤 건 1클릭으로 활성, 다른 건 2클릭 필요", "같은 hover 룰인데 일부만 cursor 다르게 표시" 같은 패턴.

**원인**: 변동성(어떤 건 되고 어떤 건 안 됨)은 element별로 **다른 상태**가 있다는 신호. CSS 룰은 selector가 같으면 모든 element에 동일 적용 — 그러니 결과가 다르면 element별 상태 차이가 원인. 가장 흔한 잔존 상태:
- 저장된 innerHTML에 중첩 `<span>`/`<br>`/`<ul>` 같은 element가 있어 caret/click 동작이 다름
- localStorage(예: `table-edits-v3`)에 옛 ID 기준 데이터가 복원되며 element별로 다른 마크업 채워짐
- contenteditable 속성이 일부에만 있고 일부에 없어 cursor/focus 동작 갈림

### 적용 순서

변동성 있으면 **CSS/이벤트 추적 전에 먼저** 시도:

1. **localStorage 클리어** + hard refresh (`Cmd+Shift+R`) → 잔존 데이터 제거
2. 잘 동작하는 element와 안 되는 element의 **innerHTML 비교** (DevTools Elements 탭) — 중첩 markup 차이 확인
3. **element 깨끗하게 재생성**: HTML 정적 마크업을 minimal text로 다시 작성, `data-edit-id` 새 패턴으로 (옛 localStorage entry와 매칭 안 되게)

이걸 다 해도 변동성이 남으면 그제서야 CSS specificity / event handler 흐름 추적.

**왜 중요한가**: dosa table.html 작업하다 셀별로 1클릭/2클릭 차이 나는 증상에 cursor: text 강제, pointer-events 토글, focus 추적, caretRangeFromPoint 등 4-5시간 추적했는데 실제 원인은 일부 셀에 stale 중첩 `<span class="sub">`/`<br>`/`<ul>` markup이 남아있던 것. 깨끗한 2행 minimal markup으로 재작성하니 즉시 해결.

dosa contenteditable 추가 함정은 [`contenteditable.md`](./contenteditable.md) 참조.
