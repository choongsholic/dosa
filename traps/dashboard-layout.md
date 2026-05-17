# dosa 슬라이드 레이아웃 함정 모음

dashboard.html(현재 `dosa-base/dashboard.html`) 류 슬라이드 보고서 작업에서 반복적으로 부딪힌 레이아웃·stacking·다크모드 함정. 새 디자인 톤 만들 때도 동일 룰 적용.

---

## 1. 슬라이드 레이아웃 시스템 (탑/미드/봇)

dosa 슬라이드는 모두 다음 구조 중 하나로 분류된다:

**A. 빅타이포 센터 정렬**
- 첫 장(커버), 마지막 장, 간지(섹션 표지)
- 큰 타이포그래피, 가로/세로 모두 센터

**B. 주요 장표 (3영역 시스템)**
- **탑(Top)**: 타이틀 + (선택) 리스트 + (선택) 항목추가 버튼 — 항상 슬라이드 상단 얼라인. 모든 주요장표 공통.
- **미드(Mid)**: 콘텐츠1 영역 — 슬라이드 세로 중앙 얼라인. **반응형**이며 해상도에 따라 잘리거나 안 보이면 안 됨.
- **바텀(Bot)**: 콘텐츠2 영역 — 슬라이드 하단 얼라인.

**B의 3가지 조합**
1. 탑 + 미드 (바텀 없음)
2. 탑 + 미드 + 바텀
3. 탑 + 바텀 (미드 없음)

### 적용 규칙
- 슬라이드 작업 전 어떤 타입(A/B1/B2/B3)인지 먼저 분류
- 주요장표는 `.slide-doc` 안에서 `flex-direction: column` 기반으로 탑(natural), 미드(margin auto로 센터), 바텀(margin-top: auto)으로 배치
- 미드 영역의 콘텐츠는 aspect-ratio 등으로 비율을 고정해 캔버스 사이즈 변화에 코너로 벌어지지 않게

**왜 중요한가**: 사용자가 명시적으로 정의한 문서 전체의 디자인 시스템. 반응형 레이아웃 작업 시 어느 영역으로 분류되는지 먼저 판단하고 그 영역의 얼라인 규칙(상/중/하)에 맞춰야 함. 미드 영역이 캔버스 폭/높이가 변해도 잘리거나 코너로 벌어지면 안 된다는 게 핵심 제약.

---

## 2. 공통 장표 타이틀 위치 — `.slide-doc` 패딩 통일

공통 장표(타이틀 + 콘텐츠 형식)는 `.slide-doc { padding: 28px 100px 70px; }`로 타이틀 위치를 통일한다. 거의 모든 장표의 기본형이며, 슬라이드 단위로 padding-top을 다시 잡지 않는다.

### 적용 규칙
- 일반 도큐먼트형 장표: `.slide-doc` 공통 패딩 28px 그대로 사용. 슬라이드별 `.slide-XXX { padding-top: ... }` 오버라이드 금지
- 예외: 타이틀 없이 센터 정렬 대문장 형식의 장표(커버형 등)는 별도 레이아웃이라 이 규칙 적용 대상 아님
- 새 장표 추가 시 별도 지시 없이도 이 위치 유지

**왜 중요한가**: 거의 모든 장표가 이 타이틀 형식을 공유하므로 슬라이드별로 다르게 잡으면 일관성이 깨짐. 28px은 슬라이드 2(세그별 명칭 정의)에서 여러 차례 상단 마진 조정 끝에 합의된 값.

---

## 3. 다크모드 반전 — 토큰화된 색상 면

색상 면을 만들 때 다크모드 반전이 자연스럽게 되도록 토큰을 사용한다. 하드코딩 색상 절대 금지.

### 토큰 매핑

**그레이 면** (라이트 박스, 살짝 톤 다운된 표면 등):
```css
background: var(--soft-fill);
/* 라이트: rgba(0,0,0,0.07) / 다크: rgba(255,255,255,0.08) */
```

**검정 면 + 흰 글자** (풋바, 강조 패널 등):
```css
background: var(--invert-bg);
color: var(--invert-text);
/* 라이트: bg #000 / text #fff / 다크: bg #fff / text #000 */
```

토큰은 `:root html.theme-light` / `html.theme-dark`에 정의 (베이스 HTML 상단).

### 적용 규칙
- 새로운 슬라이드 추가 시 절대 하드코딩 색상(`#ECECEC`, `#000` 등) 쓰지 말고 토큰 사용
- 라이트→다크 전환 시 가독성 깨지면 거의 이 룰 위반

**왜 중요한가**: 하드코딩 그레이/검정 박스는 다크모드 전환 시 그대로 남아 가독성 깨짐. "모든 그레이색상 면은 검정색 투명도로, 반전 시 흰색 투명도로 / 검정 영역은 다크 시 흰배경+검정글자로 반전" 요구가 명시됨.

---

## 4. mid 블록 z-index — hover 컨트롤 있는 블록은 처음부터 박을 것

새 mid 블록 클래스(`.X-block` 류)가 hover 시 absolute 컨트롤(설정 패널, resize handle, +/− 버튼 등)을 띄우는 구조라면, **클래스 정의 시점부터** `position: relative; z-index: 2`를 base 룰에 박을 것.

### 적용 규칙

```css
.new-block {
  position: relative;
  z-index: 2;  /* mid 콘텐츠 — top 영역 stacking context에 가로채이지 않도록 */
  ...
}
```

- 정적 표시 블록(`.dash-wrap`, `.formula-box` 같은 hover 컨트롤 없는 것)은 불필요
- dosa 스킬에 새 블록 디자인 추가 시에도 동일 룰 적용

**왜 중요한가**: top 영역(doc-title, doc-bullets, title-add-list)은 `.animate` 애니메이션으로 stacking context를 만들어 mid 컨트롤 클릭을 가로챔. 이미 `.xt-block`(line 1282), `.ix-block`(line 2085) 두 곳에서 사후 수습한 이력 있음 — 새 블록은 처음부터 막아두는 게 정석.

### 반대 방향 함정 (mid가 top의 bullet-controls 가로채기)
- mid 블록에 z:2 박으면 doc-bullets의 ±버튼(`.bullet-controls` z:5)이 같은 슬라이드 stacking context에 있더라도 hit-test 꼬여 클릭 안 먹는 케이스 발생 (4개+ 항목 등 bullets 영역이 mid에 근접할 때)
- 해결: `.doc-bullets { position: relative; z-index: 3 }` — top 영역도 명시적으로 mid보다 위에 stacking
- 즉 슬라이드 내 z 우선순위는 **bullets/title (3) > ix-block/xt-block (2) > 기타 (auto)** 로 명확히 분리

### z-index 룰 요약

| 영역 | z-index |
|---|---|
| top (bullets, title) | 3 |
| mid (xt-block, ix-block) | 2 |
| 기타 (정적 표시) | auto |

룰: **top < mid < bottom (역으로 z는 bullets/title이 가장 위)**.

---

## 페이지 분류 예시

- B1 (탑+미드): 페이지 23 (BA 직접 수익, dash-stack + dash-cap)
- B3 (탑+바텀): 페이지 4, 5

---

## 5. 비활성 슬라이드 자식의 `pointer-events: auto !important`가 다른 페이지로 새는 hit-test

**증상**: 사용자가 페이지 19에 있는데 화면 어딘가(예: 텍스트 카드 위)에 마우스 호버하면 다른 페이지(예: 페이지 26 표 슬라이드)의 `+` 버튼 같은 요소가 잡혀서 cursor 변하거나 chip이 떠 버림. **DOM 순서가 늦은 슬라이드일수록** 이 leak이 심함.

**원인**: `.slide` 부모는 `position: absolute; inset: 0; opacity: 0; pointer-events: none`로 비활성 시 invisible + 비인터랙티브 처리. 하지만 자식 element가 명시적으로 `pointer-events: auto !important`를 가지면 부모의 `none`을 우회해서 hit-test에 잡힘.

```css
/* ❌ 슬라이드 활성 여부와 무관하게 항상 인터랙티브 */
.xt-shell .xt-gap-btn { pointer-events: auto !important; }
```

`!important`가 부모의 cascade를 뚫고 들어가는 케이스. DOM 순서상 나중 슬라이드(예: data-orig-idx=25)가 자연스럽게 stacking 위에 있어서 다른 페이지에서도 viewport 좌표 기준으로 그 자식 element가 잡힘.

**해결**: 활성 슬라이드 안에서만 적용되도록 selector scope 좁히기

```css
/* ✅ 활성 슬라이드 안의 + 버튼만 인터랙티브 */
.slide.active .xt-shell .xt-gap-btn { pointer-events: auto !important; }
```

비활성 슬라이드의 자식은 부모 `pointer-events: none` 그대로 cascade 적용 → 다른 페이지에 새지 않음.

**룰**: dosa 슬라이드 안 어떤 element든 `pointer-events: auto !important` 박을 땐 반드시 `.slide.active` prefix 붙이기. 그게 슬라이드 격리(slide isolation) 정석.

## 6. 호버는 되는데 클릭만 안 되면 z-index 문제 아님 — JS 핸들러 attachment 확인

**증상**: 어떤 버튼에 호버하면 cursor도 바뀌고 toolbar도 등장하는데, 클릭하면 아무 일 안 일어남.

**오진 가능성**: "z-index 문제 아닐까?" → **아님**. z-index 문제면 hover도 같이 죽음. hover가 살아있다는 건 hit-test가 그 element에 도달한다는 뜻.

**진짜 원인 후보**:
1. **JS click handler가 부착 안 됨** — `getEventListeners(button)`이 빈 객체이고 delegation도 매칭 안 되는 경우. 정적 마크업의 element는 init 시 handler 부착 단계에서 누락 가능 (예: `ensureControls`의 early-return guard로 인해)
2. **capture phase에서 click 가로챔** — `addEventListener('click', fn, {capture: true})` + `stopPropagation`이 click event를 소비. hover는 별도 이벤트라 영향 없음
3. **mousedown에서 preventDefault** — 일부 브라우저에서 click 이벤트 발화를 막을 수 있음

**진단 순서**:
```js
// 1. 핸들러 부착 여부 확인 (Chrome DevTools)
getEventListeners(buttonElement)

// 2. click이 실제로 도달하는지
document.addEventListener('click', e => console.log('clicked:', e.target), {capture: true, once: true});

// 3. delegation 매칭 확인 — 부모/조상 어딘가의 document-level click handler가 처리해야 정상
```

호버/클릭 비대칭 발견 시 z-index부터 의심하지 말 것. 십중팔구 JS handler 또는 event flow 문제.

## 7. bfcache 복원 시 input.value와 .active 클래스 mismatch

**증상**: 페이지 19로 이동 → 브라우저 뒤로 가기 → 다시 돌아오면 카운터는 "19" 그대로인데 화면은 page 1 (cover) 표시. content와 counter가 다른 슬라이드 가리킴.

**원인**: 두 가지 다른 메커니즘이 충돌:
- **브라우저 form persistence**: `<input>`의 value를 페이지 떠난 시점 그대로 보존 (autocomplete 기본 동작)
- **JS 초기화**: 페이지 다시 로드되면 `var currentSlide = 0` + `showSlide(0)` 실행 → active 클래스가 슬라이드 0으로 리셋
- showSlide의 `if (document.activeElement !== slideCurrentEl)` 체크 때문에 input이 초점 가졌던 상태면 value 갱신 스킵 → counter는 "19" 유지

**해결** (두 겹):
```html
<!-- 1. form persistence 차단 -->
<input id="slideCurrent" autocomplete="off" ... >
```

```js
// 2. pageshow에서 강제 동기화 (bfcache + 일반 reload 둘 다 catch)
window.addEventListener('pageshow', function () {
  setTimeout(function () {
    var activeSlide = document.querySelector('#slidesWrapper > .slide.active');
    var idx = activeSlide ? slides.indexOf(activeSlide) : 0;
    if (idx < 0) idx = 0;
    currentSlide = idx;
    if (slideCurrentEl) slideCurrentEl.value = String(idx + 1);
  }, 0);
});
```

`setTimeout(..., 0)` 필수: 다른 init/restore 핸들러가 끝난 다음 실행되어야 그들이 다시 덮어쓰는 race를 피함. 또 `slideCurrentEl.blur()`는 호출하지 말 것 — blur 핸들러(`commitSlideNumberEdit`)가 트리거되어 옛 input 값으로 다시 navigate해버림.

**룰**: 브라우저 form 자동 저장이 영향 줄 수 있는 상태 입력 element는 `autocomplete="off"` 박고, pageshow에서 실제 DOM 상태 기준으로 강제 동기화.
