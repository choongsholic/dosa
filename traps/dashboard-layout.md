# dosa 슬라이드 레이아웃 함정 모음

dashboard.html(현재 `aqua-dashboard/dashboard.html`) 류 슬라이드 보고서 작업에서 반복적으로 부딪힌 레이아웃·stacking·다크모드 함정. 새 디자인 톤 만들 때도 동일 룰 적용.

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
