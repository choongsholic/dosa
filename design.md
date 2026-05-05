# Dashboard 슬라이드 디자인 가이드

`dashboard.html`을 기준으로 정리한 디자인 시스템 / 컴포넌트 / 사용 패턴 레퍼런스. 새 보고서를 같은 톤으로 만들고 싶을 때 이 문서를 참조해서 요건을 작성하거나 Claude에게 넘기면 된다.

---

## 1. 기본 사양

- 단일 HTML 파일에 27장 슬라이드 + JS/CSS 인라인. 폰트만 `../fonts/`에서 로컬 로드
- 캔버스 크기: **2040 × 1080px** 고정. JS가 뷰포트에 맞춰 scale + 위치 조정
- 다크/라이트 테마 토글 (`html.theme-dark` / `html.theme-light`)
- 다른 컴포넌트 추가 가능. 단 새로 만들지 말고 가능하면 기존 컴포넌트 재사용을 우선

---

## 2. 디자인 토큰 (CSS 변수)

### 핵심 룰 — 7개 토큰이 단일 출처

**규칙**: 포인트 컬러 5개와 검정/흰색 2개, **이 7개 hex만이 정의된 색상**. 그 외 모든 회색·배경·테두리·소프트 면은 검정 또는 흰색의 알파 파생(`color-mix(in srgb, var(--tc-*) N%, transparent)`)이어야 함. Tailwind 팔레트나 별도 hex 박지 말 것.

```css
:root {
  /* 단일 출처 — 이 값들만 바꾸면 전체 톤이 따라옴 */
  --tc-black: #000000;
  --tc-white: #ffffff;
  --tc-blue:   #1d72e8;
  --tc-green:  #00b85e;
  --tc-red:    #FF0238;
  --tc-orange: #d97a6c;
  --tc-yellow: #FFC300;
}
```

### 모드 토큰 — 모두 위 7개에서 파생

라이트 모드:
```css
html.theme-light {
  --bg:       color-mix(in srgb, var(--tc-black) 4%, var(--tc-white));
  --surface:  var(--tc-white);
  --surface-2:color-mix(in srgb, var(--tc-black) 2%, var(--tc-white));
  --surface-hover: color-mix(in srgb, var(--tc-black) 8%, var(--tc-white));
  --border:        color-mix(in srgb, var(--tc-black) 12%, transparent);
  --border-strong: color-mix(in srgb, var(--tc-black) 28%, transparent);
  --text:          var(--tc-black);
  --text-secondary:color-mix(in srgb, var(--tc-black) 60%, transparent);
  --soft-fill:     color-mix(in srgb, var(--tc-black) 7%, transparent);
  --invert-bg:     var(--tc-black);
  --invert-text:   var(--tc-white);
  --accent:    var(--tc-green);
  --negative:  var(--tc-red);
  --discuss:   var(--tc-red);
  --warning:   var(--tc-orange);
}
```

다크 모드(`html.theme-dark`)는 검정/흰색을 반대로 alpha-mix.

### 본문 / 컴포넌트에서 색 쓰는 법

- 본문 텍스트: `color: var(--text)` (검정 100%) / `color: var(--text-secondary)` (검정 60% — 보조 캡션·노트)
- 강조 행/카드 배경: `background: color-mix(in srgb, var(--tc-yellow) 8%, transparent)` (옐로우 8% 톤)
- 별표·아이콘 포인트: `color: var(--tc-orange)` 등 직접 토큰 참조
- **포인트 컬러를 쓸 땐 반드시 `var(--tc-*)`** — `#FF0238` 같은 hex 직접 박지 말 것

### 폰트 패밀리
- 본문/UI/숫자: `'SFProDisplay', sans-serif`
- 제목/큰 숫자: `'YouandiNewKrTitle', 'SFProDisplay', sans-serif`
- 폰트 파일: `../fonts/SF-Pro-Display-Medium.otf` / `Bold.otf` / `YouandiNewKrTitle-Bold.ttf`

### 폰트 스케일링
- 모든 폰트는 `font-size: calc(Npx * var(--font-scale))` 패턴
- `--font-scale` 기본값 1, 컨트롤로 0.7~1.5 조절
- **인라인으로 px 박는 건 피할 것** — 글로벌 스케일이 안 먹힘

---

## 3. 슬라이드 타입

각 슬라이드는 `<section class="slide [타입]">`. 슬라이드 자체는 `position:absolute; inset:0` + opacity 트랜지션.

| 타입 | 용도 | 핵심 구성 |
|---|---|---|
| `slide-cover` | 표지 | `cover-label` + `cover-title` + `cover-author` |
| `slide-doc` | 일반 문서 슬라이드 | `doc-title` + `doc-bullets` + 본문 |
| `slide-segments` | 세그 명칭/정의 표 | `seg-block` × N |
| `slide-intro` | 섹션 인트로 | `slide-intro-body` + 3카드 |
| `slide-eod` | 마지막 (감사합니다) | 큰 텍스트 중앙 |

---

## 4. 재사용 컴포넌트

### 4.1 헤더 / 타이틀

```html
<!-- 슬라이드 제목 (좌상단) -->
<h2 class="doc-title animate delay-1">제목</h2>

<!-- 불릿 리스트 (제목 아래) -->
<ul class="doc-bullets animate delay-2">
  <li>설명 1</li>
  <li class="hl">강조 항목 (그린 점)</li>
</ul>

<!-- 중앙 대문장 (큰 메시지) -->
<div class="head-center animate delay-2">한 줄 메시지</div>
```

### 4.2 카드 그룹

**3카드 가로 그리드 (인트로용):**
```html
<div class="intro-cards">
  <div class="intro-card animate delay-2">
    <h3>제목</h3>
    <p>설명</p>
  </div>
  <div class="intro-card animate delay-3">...</div>
  <div class="intro-card animate delay-4">...</div>
</div>
```

**라이프 사이클 카드 (검정 헤더 + 흰 바디):**
```html
<div class="lc-cards">
  <div class="lc-card">
    <div class="head"><span>FAI</span><span class="en">First Action Index</span></div>
    <div class="body">
      <div>본문 1</div>
      <div>본문 2</div>
    </div>
  </div>
  <!-- 반복 -->
</div>
```

**일반 박스 카드 (검정 헤더):**
```html
<!-- 1열 -->
<div class="bh1 animate delay-3">
  <div class="bhx-card">
    <div class="head">제목</div>
    <div class="body">
      <h4>소제목</h4>
      <ul><li>항목</li></ul>
    </div>
  </div>
</div>

<!-- 2열 -->
<div class="bh2 animate delay-3">
  <div class="bhx-card">...</div>
  <div class="bhx-card">...</div>
</div>
```

**RDI 식 카드 (가운데 정렬 + 하단 공식):**
```html
<div class="bh2">
  <div class="bhx-card rdi-card">
    <div class="head">루틴 RDI</div>
    <div class="body">
      <div class="lede">달성 조건</div>
      <p class="cond">조건 본문</p>
      <div class="formula-mini">RDI = ... * 100</div>
    </div>
  </div>
</div>
```

**BA 카드 (제목 + lede + 항목 리스트):**
```html
<div class="ba-cards animate delay-3">
  <div class="ba-card">
    <div class="head">직접 수익</div>
    <div class="body">
      <div class="lede">앱 이용으로 발생한<br>신규/증분 수익</div>
      <div class="items">
        <div class="label">주요 항목</div>
        <ul>
          <li>CA, CL, 리볼빙</li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

**4패턴 카드 (OOO/XOO/OXO/XXO 같은 패턴 그리드):**
```html
<div class="pat4 animate delay-3">
  <div class="pat4-card">
    <div class="pat4-head">OOO</div>
    <div class="pat4-desc">3개월 연속 방문</div>
    <div class="pat4-stat">31% <small>+2%p</small></div>
    <div class="pat4-cnt">237만</div>
  </div>
  <!-- 4개 반복 -->
</div>
```

### 4.3 공식 박스

```html
<!-- 큰 공식 박스 (페이지 중앙용) -->
<div class="formula-box animate delay-3">
  <div class="formula">FAI = 온보딩 달성자 수 / 신규 회원 수<span class="star">*</span>100</div>
</div>

<!-- 공식 노트 (하단 보조 설명) -->
<div class="formula-notes animate delay-4">
  <p>온보딩 기능 달성자 수 = ...</p>
  <p>신규 회원 수 = 당월 앱 가입자 수</p>
</div>

<!-- 미니 공식 (rdi-card 내부) -->
<div class="formula-mini">루틴 RDI = 달성자 수 / 이용자 수 * 100</div>
```

### 4.4 라이프사이클 단계 (lc-stages)

```html
<div class="lc-stages animate delay-3">
  <div class="lc-stage">신규 사용자</div>
  <div class="lc-stage">정기 사용자</div>
  <div class="lc-stage">습관적 사용자</div>
</div>
```

### 4.5 비교 박스 (compare-rounded)

```html
<!-- 골드 톤 비교/예시 박스 -->
<div class="compare-rounded animate delay-3">
  내용
</div>
```

### 4.6 라벨 / 뱃지

```html
<span class="badge-discuss">논의 필요</span>  <!-- 빨간 pill -->
```

### 4.7 대시보드 이미지 (참고 화면)

> **이미지 인라인 룰 (필수)**
> 요건서에 폴더 이미지가 첨부되어 있으면 외부 경로 참조(`src="imgs/foo.png"`)가 아니라 **base64 data URL**로 HTML에 직접 박을 것. 단일 HTML로 self-contained되게 — 파일 옮길 때 깨지지 않도록.
>
> ```python
> import base64
> with open(path, 'rb') as f:
>     b64 = base64.b64encode(f.read()).decode('ascii')
> src = f'data:image/png;base64,{b64}'
> ```
>
> 결과 마크업: `<img src="data:image/png;base64,iVBORw0KGgo...">`

```html
<div class="dash-wrap animate delay-3">
  <img src="data:image/png;base64,..." alt="...">
</div>
<p class="dash-cap animate delay-4">ex) 이미지 캡션</p>

<!-- 좌우 분할 (이미지 + 캡션) -->
<div class="dash-split">
  <div class="dash-side-img">
    <img src="data:image/png;base64,...">
    <p class="dash-cap">캡션</p>
  </div>
  <div class="dash-text">설명 텍스트</div>
</div>
```

### 4.8 표 (구축 계획 등)

```html
<div class="attn-center">
  <table class="plan-table">
    <thead>
      <tr><th>버전</th><th>주기</th><th>지표</th><th>출처</th></tr>
    </thead>
    <tbody>
      <tr class="row-schedule">
        <td>...</td>
      </tr>
      <tr class="row-hl">
        <td>강조 행 (크림옐로우)</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4.9 세그 명칭 표 (커버 다음 슬라이드용)

```html
<div class="seg-block animate delay-2">
  <div class="seg-track-label">Acquisition</div>
  <table class="seg-table">
    <thead><tr><th>구분</th><th>A안</th><th>B안</th><th>C안</th><th>D안</th></tr></thead>
    <tbody>
      <tr><td>...</td><td>...</td></tr>
    </tbody>
  </table>
</div>
```

---

## 5. 레이아웃 wrapper

### attn-center
페이지 본문을 세로 중앙 정렬할 때 사용. flex column + justify-content: center + padding-bottom: 70.

```html
<section class="slide slide-doc">
  <h2 class="doc-title">제목</h2>
  <ul class="doc-bullets"><li>...</li></ul>
  <div class="attn-center">
    <!-- 카드/공식/박스 등 본문 -->
  </div>
</section>
```

### .bh1 / .bh2 / .pat4 / .lc-cards / .ba-cards
- `.bh1` — 단일 박스 (1열)
- `.bh2` — 2열 그리드 (gap: 36px)
- `.pat4` — 4열 그리드 (gap: 26px)
- `.lc-cards` — 3카드 균등 (lc 전용)
- `.ba-cards` — 3카드 균등 (BA 전용)

---

## 6. 애니메이션 시스템

```html
<element class="animate delay-1">...</element>
```

- `.animate` — `fadeInUp 0.55s ease-out` (아래에서 위로 페이드인)
- `.delay-1` ~ `.delay-8` — 0.1초 간격 지연
- 여러 요소를 순차적으로 등장시킬 때 `delay-1, delay-2, delay-3, ...`로 나눠서 적용
- **카드 그룹 안의 카드 각각**에 delay 다르게 줘서 카드가 하나씩 등장하는 효과 가능 (단, 너무 과한 stagger는 사용자가 어색하다고 함 — 슬라이드당 5~7개 정도가 적정)

---

## 7. 시스템 기능 (모든 슬라이드 공통)

### 키보드
- `←` / `→` / `Space` / `PgUp` / `PgDn` — 페이지 이동
- `Home` / `End` — 처음 / 마지막
- `T` — 다크/라이트 토글
- `↑` — 오버뷰 패널 열기 (썸네일 + 컨트롤)
- `↓` / `Esc` — 오버뷰 패널 닫기
- 인라인 편집 중: `Cmd/Ctrl+↑↓` — 폰트 크기, `Cmd/Ctrl+B` — 굵게, `Cmd/Ctrl+Enter` — 저장 종료, `Esc` — 취소

### 마우스
- 텍스트 클릭 → 인라인 편집 모드 진입 (편집 가능 leaf만)
- 호버 → 그린 아웃라인 (편집 가능한 가장 안쪽 요소만)

### 컨트롤 (오버뷰 패널 내)
- 전체화면
- 테마 토글
- 폰트 A− / 100% / A+
- PNG 다운로드
- Print
- HTML 내보내기 (인라인 편집 결과 포함)

### localStorage 키
- `dashboard-theme` — 다크/라이트 상태
- `dashboard-font-scale` — 글로벌 폰트 스케일
- `dashboard-edits-v3` — 인라인 편집 결과 (id별 innerHTML + fontSize)

**새 보고서로 클론할 때 키를 바꿔야 충돌 안 남:**
- 예: `dashboard-edits-v3` → `report-Q1-edits-v1` 등으로 rename

---

## 8. 의도된 비일관성 (보존 사항)

원본에 의도적으로 두 가지 표기가 공존하는 부분:
- VRI: page 6에서 "Visit Regularity Index", page 14에서 "Visit Recurrence Index" — 용어 후보 두 개를 일부러 노출
- LPI 정의 박스의 변수명은 LRI — 또 다른 후보

**새 보고서에선 이런 의도 없으면 한 가지로 통일.**

---

## 9. 27장 구성 사례 (현재 dashboard.html)

| 페이지 | 내용 | 컴포넌트 |
|---|---|---|
| 0 | 표지 | slide-cover |
| 1 | 세그 명칭 표 | slide-segments + seg-block |
| 2 | V.08 인트로 (3카드) | slide-intro + intro-cards |
| 3-4 | V.08 split (현황/이탈) | slide-doc + doc-bullets + dash-wrap |
| 5 | 야구 vs 카드앱 | head-center + compare-rounded |
| 6 | FAI/RDI/VRI 흐름 | head-center + lc-stages + lc-cards |
| 7-9 | FAI (정의/조건/대시보드) | doc-bullets + formula-box + bh1 + dash-wrap |
| 10-13 | RDI (정의/2동력/루틴+혜택/대시보드) | formula-box + bh1 + bh2.rdi-card + dash-wrap |
| 14-16 | VRI (정의/4패턴/대시보드) | formula-box + pat4 + dash-wrap |
| 17-20 | LPI (논의 필요) | badge-discuss + bh2 + pat4 + dash-wrap |
| 21-24 | BA (인트로/직접/비용절감/간접) | ba-cards + dash-split |
| 25 | 구축 계획 표 | plan-table |
| 26 | EOD | slide-eod |

**전형적 흐름:** 표지 → 인트로 → 본론(섹션별 4-5장) → 결론/계획 → EOD

**섹션 패턴:** "정의(공식 한 줄) → 측정 방식(2동력/4패턴) → 대시보드 화면" 3-4장

---

## 10. 새 보고서 만들기 워크플로우

### 사용자가 제공할 요건서 형식

```
보고서 제목: ___
청중: 상사 / 팀 / 외부
톤: 진행 보고 / 결론형 / 논의용 / 의사결정 요청

[슬라이드 1] 표지
- 큰 제목, 부제, 작성팀, 날짜

[슬라이드 2] 인트로 (3카드)
- 카드1: 제목 / 본문
- 카드2: 제목 / 본문
- 카드3: 제목 / 본문

[슬라이드 3] 핵심 메시지
- 한 줄 대문장

[슬라이드 4] 데이터 / 표
- 표 컬럼 / 행 정의

[슬라이드 N] EOD
```

### Claude의 작업
1. dashboard.html 복제 → 새 파일명
2. localStorage 키 rename (충돌 방지)
3. 슬라이드 27장 자리에 요건에 맞춰 재구성:
   - 같은 패턴이면 기존 컴포넌트 그대로 재활용
   - 새 패턴이면 같은 토큰으로 새 컴포넌트 추가
4. 카운터 (`5 / 27`) 자동 갱신
5. 이미지/차트는 placeholder로 두고 자료 받으면 임포트

### Claude가 자유롭게 결정해도 되는 영역
- 카드 수 / 레이아웃 패턴 (2열 / 3열 / 4열)
- 애니메이션 delay 분배
- 색상 강조 위치 (--accent 사용 빈도)
- bullet 강조 (`<li class="hl">`)

### Claude가 사용자 확인 받아야 하는 영역
- 슬라이드 개수 추가/삭제
- 의미 변경/요약/재작성
- 대규모 재구조 (섹션 합치기/분리)
- 새 컴포넌트 도입 (기존 컴포넌트로 안 풀리는 경우만)

---

## 11. 슬라이드 내 상/중/하 콘텐츠 정렬 패턴

슬라이드를 **상단 / 중앙 / 하단** 3구역으로 나눠서 자동 분배하는 표준 방식. flex column + auto margin으로 HTML 구조 변경 없이 구현.

### 적용 예시 (`.slide-intro`)

```
<section class="slide slide-intro">      /* flex column, padding: 0 */
  <div class="slide-intro-body">         /* flex: 1 */
    <h2 class="doc-title">...</h2>        /* 상단 */
    <h2 class="slide-title sm">...</h2>  /* 중앙 그룹 시작 */
    <div class="intro-cards">...</div>   /* 중앙 그룹 끝 */
  </div>
  <div class="intro-footer">...</div>    /* 하단 */
</section>
```

```css
/* slide-intro 자체 — flex column */
.slide-intro { padding: 0; display: flex; flex-direction: column; }

/* body는 flex: 1로 가용공간 차지, 안에서 다시 flex column */
.slide-intro-body {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  padding: calc(80px * var(--font-scale)) 100px 60px;
}

/* 상단 콘텐츠 — 자연 위치 (margin 없음) */
.doc-title { /* 위쪽에 그대로 */ }

/* 중앙 그룹 시작 요소에 margin-top: auto */
.slide-intro .slide-title { margin: auto 0 100px; }

/* 중앙 그룹 마지막 요소에 margin-bottom: auto */
.intro-cards { margin-bottom: auto; }

/* 하단 콘텐츠 — slide-intro의 마지막 자식이라 자동 하단 */
.intro-footer { /* flex column 마지막 자식 */ }
```

### 동작 원리

flex column에서 `auto` 마진은 가용 공간을 흡수한다. 두 개의 auto가 경쟁하면 공간이 균등 분할.
- `slide-title`의 `margin-top: auto` → 위쪽 빈 공간을 절반 흡수
- `intro-cards`의 `margin-bottom: auto` → 아래쪽 빈 공간을 절반 흡수
- 결과: doc-title은 위에 붙고, slide-title+intro-cards 그룹은 가운데 떠 있고, intro-footer는 자연스레 바닥(slide-intro의 마지막 flex child)

### 일반화 규칙

| 콘텐츠 위치 | 적용 방법 |
|---|---|
| **상단** | flex 첫 자식, margin 기본 |
| **중앙 그룹 (시작)** | `margin-top: auto` |
| **중앙 그룹 (끝)** | `margin-bottom: auto` |
| **하단** | 부모 flex column의 마지막 자식 |

### 주의 사항

- 부모는 반드시 `display: flex; flex-direction: column;` + 가용 높이 확보 (`flex: 1` 또는 명시적 `height`)
- 중앙 그룹이 1개 요소뿐이면 양쪽 모두 auto: `margin: auto 0`
- 중앙 그룹 내부 요소 간격은 일반 margin/gap으로 (auto 끼우면 분배 깨짐)
- 하단 요소가 별도 wrapper 밖에 있어야 자연스레 바닥에 위치 (intro-body 안에 있으면 안 됨)

이 패턴은 `.slide-intro` 외 다른 슬라이드에도 동일하게 적용 가능. 콘텐츠 양에 따라 자동 분배되므로 viewport 높이 변화에도 균형 유지.

---

## 12. 카드 컴포넌트 매핑 가이드 (표 → 카드 재구성)

**핵심 원칙**: 노션 원본의 표/박스를 plan-table에 1:1로 옮기는 안전한 길은 빠르지만 dashboard 톤의 강점(검정 헤더 카드의 위계감)을 못 살림. 표→카드 재구성이 가능한지 먼저 검토.

### 콘텐츠 패턴 → 컴포넌트 매핑

| 콘텐츠 패턴 | 컴포넌트 | 예시 |
|---|---|---|
| 정의 + 조건/공식 | `bh2` + `rdi-card` (head + lede + 하단 공식 박스) | DP-AQUA v0.8/v1.0, FAI/RDI 정의 |
| 단계 / 패턴 4종 | `pat4` 4카드 (검정 코드 헤더 + top desc + bot 강조) | ADI 1~4점, OOO/XOO/OXO/XXO |
| 분기 / 시점 비교 3종 | `lc-cards` 3카드 (검정 헤더 + 흰 바디) | Q2/Q3/Q4 로드맵 |
| 세그/카테고리별 디테일 N종 | `bh2` 또는 `bh1` (헤더 + 본문 리스트/문단) | 세그먼트별 실행 수단, 신규 과제 |
| 1줄 큰 메시지 + 보조 1~2줄 | `head-center` + `formula-notes` | 미션 인용, 핵심 메시지 |
| 다차원 그리드 데이터 | `plan-table` (이때만 표가 정답) | 성과 측정 지표/현재/목표 |
| 세그 명칭 N종 N트랙 | `seg-table` (다행 다열 그리드) | 6개 세그먼트 정의 |

### "표가 정답"인 경우 vs "카드가 정답"인 경우

표가 정답:
- 행과 열이 모두 의미 있는 **다차원 데이터** (예: 지표 × 시점, 시스템 × 버전)
- 셀 간 정렬·비교가 직관적 가치 (수치, 일자 같은 정형 데이터)

카드가 정답:
- 정의·단계·패턴·비교 — 카드 헤더로 명칭이 강조되고, 본문에 자유 형식 콘텐츠
- 시각적 위계 (검정 헤더의 무게)가 의미를 강화

표가 약하면 카드로 재구성을 시도. plan-table 5행 이상 + 각 행이 자유 형식 텍스트면 거의 카드가 더 강하다.

---

## 13. 표 타이포그래피와 강조

### 13.1 표 위 컨텍스트 라벨 (필수)

모든 plan-table·seg-table 위에 한 줄 라벨을 둔다 — `seg-track-label` 패턴.

```html
<div class="seg-track-label">PERFORMANCE METRICS</div>
<table class="plan-table">...</table>
```

스타일: 대문자 영문, secondary 색, letter-spacing 0.06em, 28px급. "이게 무슨 표인가" 즉답으로 시선 안정.

### 13.2 두 폰트로 위계

- **SF Pro Display Bold** → 영문/숫자/지표명 (정확·모던·가독)
- **YouandiNewKrTitle (You&I)** → 한국어 큰 강조/한 단어 명칭 (드라마틱)

한국어와 영문이 섞일 때 폰트로 구분하면 위계가 살아남. 같은 폰트에 굵기·크기만 다르게 하면 평평해짐.

### 13.3 셀 안에서도 위계 (큰 제목 + 작은 설명)

한 셀에 두 단계 가능:

```html
<td>
  <div class="cell-lede">데이터 자동 업데이트 목표</div>
  <div class="cell-sub">전체용: MIS Vs. SALAD<br>내부용: SALAD</div>
</td>
```

`cell-lede` (큰 굵음, 본문 색) + `cell-sub` (작은, secondary 색).

### 13.4 row-hl로 핵심 행 강조

```html
<tr class="row-hl"><td>MAU</td><td>763만</td><td>800만</td></tr>
```

크림옐로우 배경. **모든 plan-table에 핵심 행 1~2개**는 강조해서 "이 표에서 어디를 봐야 하나"에 즉답.

### 13.5 표 셀 기본 폰트는 본문보다 작게

- `--doc-bullets-size` (본문) 22px이면, 표 셀은 18~20px 수준
- 표는 정보 그리드의 본질이라 기본은 작게 가고, 강조하고 싶은 셀만 Cmd+↑로 키우는 흐름
- CSS에 `--table-cell-size` 변수 신설 권장 (`--doc-bullets-size`와 분리)

### 13.6 폰트 사이즈 단축키 스코프 (table)

- `doc-title` / `doc-bullets` → 글로벌 shared sizes (모든 슬라이드 동시) — 기존 동작 유지
- **`th` / `td` (테이블 셀)** → **현재 슬라이드 내 같은 그룹 셀끼리만** 동시 변경 (슬라이드별 독립)

"같은 그룹"의 정의 옵션 (구현 시 결정):
1. 셀 역할 기반: 같은 슬라이드의 모든 `th`끼리 / 모든 `td`끼리
2. 행 인덱스 기반: 모든 표의 같은 row index끼리
3. 명시적 클래스 마커: `cell-headline` / `cell-detail` 등 직접 부여

localStorage 키 분리:
- `<work>-shared-sizes` (글로벌)
- `<work>-table-sizes-{slideIdx}` (슬라이드별 그룹)

---

## 14. 베이스 HTML 위치 (작업물 생성 시)

새 작업물 만들 때:

1. 베이스 HTML(`~/.claude/skills/dosa/aqua-dashboard/dashboard.html` 또는 `dashboard_org.html`)을 cp → 사용자 작업 공간의 새 작업물 폴더에 저장 (예: `<DOSA-ROOT>/<work>/<work>.html`)
2. localStorage 키 rename (`dashboard-` → `<work>-`) — 충돌 방지
3. 슬라이드 영역(`<div class="slides-wrapper">`~`</div>`) 안 27장을 새 콘텐츠로 교체. 카운터(slideTotal)는 JS가 자동 갱신
4. 폰트 경로(`../fonts/`)는 그대로 — 사용자 작업 공간의 `<DOSA-ROOT>/fonts/` 가리킴 (도사가 첫 호출 시 스킬에서 cp)
5. 본 가이드의 12절(카드 매핑)·13절(표) 룰 따라 콘텐츠 변환

---

## 15. 사용자 입력 라벨 표기 (선택)

도사는 자연어 보고 알아서 컴포넌트 매핑하지만, 사용자가 더 명확하게 의도 전달하고 싶으면 다음 라벨 표기를 요건서에 사용할 수 있다. 라벨이 있으면 도사가 우선적으로 그 컴포넌트를 사용.

### 라벨 → 컴포넌트 매핑

| 라벨 | 컴포넌트 |
|---|---|
| `[문서 제목]` `[팀명]` `[날짜]` | `slide-cover` (커버 전용) |
| `[장표 제목]` | `doc-title` |
| `[부제]` | `slide-title.sm` |
| `[중앙 대문장]` | `head-center` |
| `[설명 (불릿)]` | `doc-bullets` (`(강조)` 표시 시 `<li class="hl">`) |
| `[3카드]` `[N카드]` | `intro-cards` (가로 N개 균등 그리드) |
| `[검정 헤더 N카드]` | `lc-cards` (head + body 구조) |
| `[2열 박스]` `[1열 박스]` | `bh2` / `bh1` |
| `[2열 박스 (RDI 형태)]` | `bh2` + `rdi-card` (가운데 lede + 조건 + 공식 박스) |
| `[BA 3카드]` | `ba-cards` (head + lede + 항목 리스트) |
| `[4패턴 카드]` | `pat4` (코드 헤더 + 상단/하단 텍스트) |
| `[비교 박스]` | `compare-rounded` (골드 톤) |
| `[단계 표시 (N stages)]` | `lc-stages` |
| `[공식]` `[공식 노트]` | `formula-box` / `formula-notes` |
| `[이미지]` | `dash-wrap` (파일명 + 설명. 받기 전엔 placeholder) |
| `[이미지 좌우 2분할]` | `dash-wrap.dual` |
| `[좌우 분할 — 좌:이미지+캡션, 우:리스트]` | `dash-split` |
| `[표 — N컬럼 × N행]` | `plan-table` (주의: 12절 "카드 vs 표" 검토 후) |
| `[하단 메시지]` `[하단 푸터]` | `intro-footer` |
| `[큰 텍스트 중앙]` | `eod-text` 또는 cover/section 큰 타이포 |
| `[N 라벨]` (예: `[논의 필요 라벨]`) | `badge-discuss` 등 인라인 뱃지 |

**새로운 형태 필요하면 라벨 자유 추가** — 도사가 보고 적절한 컴포넌트 매핑하거나 신규 컴포넌트 추가.

### 요건서 형식 예시

```
## 1장
[문서 제목]
정밀 타격 대시보드

[팀명]
UX Insight팀

[날짜]
2026. 4. 28

## 2장
[장표 제목]
세그별 명칭 정의

[3카드]
- 카드1: 미설치자 / 신규 발급 후 미로그인
- 카드2: 장기 미이용자 / 3개월 초과
- 카드3: 간헐 이용자 / 3개월 내 비연속

(이하 N장까지 자유)
```

위 형식은 선택. 도사는 라벨 없는 자연어 텍스트(노션 복붙 등)도 그대로 받아 변환한다.

### 추가로 알려주면 좋은 정보 (선택)
- 청중 (상사 / 팀 / 외부)
- 톤 (진행보고 / 결론형 / 논의용 / 의사결정 요청)
- 강조하고 싶은 슬라이드 / 메시지

---

## 17. 텍스트 서식 popover (인라인 편집 도구)

### 트리거
- 편집 가능 영역(`.editable[contenteditable="plaintext-only"]` 또는 `[contenteditable="true"]`)에서 텍스트를 **드래그 → mouseup** 시 popover 등장
- Cmd+A / Shift+화살표 같은 키보드 선택도 selectionchange로 80ms debounce 후 popover
- selection이 collapse되거나 popover 외부 클릭 시 자동 hide

### 구성 (좌→우)
```
┌──────────────────────────────────────────────────┐
│ [알파 ━━━━●━━━ 100 %]              [⫷ ⫶ ⫸] │  ← 알파 row + 정렬
│ [SF/Y&I] | ⚫⚪ 🔵🟢🔴🟠🟡 |   🔗 링크         │  ← 폰트/색상/링크
└──────────────────────────────────────────────────┘
```

### 색상 swatch
- 7개: `default`(검정 모드자동) / `inverse`(흰색 모드자동) / `blue` / `green` / `red` / `orange` / `yellow`
- 모두 `var(--tc-*)` 토큰 참조 — 토큰 hex 바꾸면 swatch + 본문 적용분 동시 갱신
- swatch bg는 popover에서 런타임 `getComputedStyle`로 읽어 detection에 사용

### 알파
- 색상 클릭 시 알파 row 활성화 (슬라이더 + 숫자 0~100%)
- 키보드: 슬라이더 focus 상태에서 ↑↓ ±1, Shift+↑↓ ±10
- ←→는 native 슬라이더에 맡기되 슬라이드 네비/오버뷰 트리거되지 않게 stopPropagation
- 색 다른 색으로 재클릭 시 기존 알파 보존

### Wrapper 구조 (DOM)
```html
<!-- 색 + 알파 (CSS 변수 --a 사용) -->
<span class="t-c" data-c="orange" style="--a:0.6">텍스트</span>

<!-- 폰트 토글 -->
<span class="t-f" data-f="sf">SF Pro 텍스트</span>
<span class="t-f" data-f="yi">Y&I 텍스트</span>
```

CSS:
```css
.t-c { color: color-mix(in srgb, var(--t-c-base, currentColor) calc(var(--a, 1) * 100%), transparent); }
.t-c[data-c="default"] { --t-c-base: var(--text); }
.t-c[data-c="inverse"] { --t-c-base: var(--invert-text); }
.t-c[data-c="blue"]    { --t-c-base: var(--tc-blue); }
.t-c[data-c="green"]   { --t-c-base: var(--tc-green); }
.t-c[data-c="red"]     { --t-c-base: var(--tc-red); }
.t-c[data-c="orange"]  { --t-c-base: var(--tc-orange); }
.t-c[data-c="yellow"]  { --t-c-base: var(--tc-yellow); }
```

### Detection (popover 등장 시 자동 동기화)
- `.t-c` 래퍼 안 → swatch active + 알파 슬라이더에 매핑
- 래퍼 없이 CSS 컬러(예: `var(--text-secondary)` = `color(srgb 0 0 0 / 0.6)`)일 때도 computed color 분석 → 가장 가까운 swatch + 알파 역산
- 다중 색상/알파일 때 → swatch 모두 비활성, 알파 row 비활성. 색 재클릭하면 기존 t-c 모두 unwrap 후 일괄 wrap
- 폰트 자동 감지: `.t-f` 래퍼 또는 computed `font-family`에 'youandi' 포함 여부로 토글 라벨 갱신
- **컬러 파싱은 `rgb()`, `rgba()`, `rgb(r g b / a)`, `color(srgb r g b / a)` 모두 지원** (Chrome의 `color-mix()` 결과는 `color(srgb ...)` 반환)

### 링크
- 표기: 본문 색 유지 + `text-decoration: underline 1.5px / offset 3px`
- 클릭: capture phase에서 가로채서 `window.open(href, '_blank', 'noopener')` (편집 모드 무관)
- 호버: mini-popup으로 URL + 편집/제거 버튼 (220ms hide debounce)
- 링크 버튼: 선택이 이미 link 안이면 라벨이 "🔗 편집/제거"로 토글, 비어있는 URL 입력 = 제거

### 정렬
- 좌/중/우 정렬 — `getBlockEditable(node)`로 가장 가까운 editable에 `style.textAlign` 직접 설정
- popover 등장 시 현재 정렬 자동 감지하여 active 버튼 표시
- 저장: `saveBulletsForSlide`가 li의 inline `style.height`/`style.minHeight`만 선택 클리어 (textAlign 보존)

### 부가 기능
- **선택 하이라이트 보존**: popover input(slider/number)에 focus 가서 native selection이 collapse되어도 `.t-fake-hl` 오버레이로 시각적 하이라이트 유지 (`range.getClientRects()` × `position: fixed`)
- **Format undo/redo**: 색/폰트/링크 변경 직전 `editable.innerHTML` 스냅샷 stack. Cmd+Z / Cmd+Shift+Z

### 추가 시 주의사항 (도사가 새 슬라이드 만들 때)
- 본문 텍스트는 `var(--text)` / `var(--text-secondary)` 사용 (토큰 자동 매핑됨)
- 강조용 인라인 색은 `<span class="t-c" data-c="green">` 같은 래퍼 사용 (또는 사용자가 popover로 적용)
- HTML `<font color="...">` 같은 deprecated 태그 ❌ — `<span class="t-c" data-c="...">` ✓
- 직접 hex 박지 말고 토큰 참조

---

## 16. 변경 이력 / 가이드 적용 규칙

이 가이드는 dashboard.html v0.8 (2026-04-28) 기준 + 도사 학습 누적 (2026-04-30) + new2-dashboard.html 표준화 (2026-05-04). 디자인 토큰이나 컴포넌트가 바뀌면 이 문서도 같이 업데이트할 것.

**Claude(도사)에게 새 보고서 요청 시 이 문서 + `dosa.md`(공통 변환 원칙)를 같이 참조하면 디자인 톤 일관성 확보. 두 파일 모두 `~/.claude/skills/dosa/`에 위치.**

---

## 17. 표준 베이스 = `new2-dashboard.html` (2026-05-04~)

베이스 HTML이 `dashboard.html` → `new2-dashboard.html`로 전환됨. 다음 시스템들이 추가됨:

### xt 테이블 시스템 (Notion-style 인터랙티브 표)
- **구조**: `.xt-block > .xt-title + .xt-desc + .xt-shell > table.xt > tbody > tr > td.xt-cell`
- **셀 인터랙션**: 클릭 → 인라인 편집(plaintext-only). 셀 우측 ⋮ 메뉴(정렬/색상/폰트/헤드라인). 다중 선택 드래그.
- **행/열 추가/삭제/이동**: gap의 + 버튼, 핸들 드래그.
- **gap 라인 색상**: gap의 + 버튼 → 칼라칩 popover로 행/열 사이 라인 색 토글.
- **헤드라인 (폰트 그룹)**: 같은 그룹 셀들 폰트 사이즈 동기화. Cmd+↑↓로 그룹 사이즈 조절.
- **bullet**: 셀 내 `- ` 입력 시 `.xt-bullet-content > .xt-bullet-line[]` 다중 라인 구조로 변환. xt-cell뿐 아니라 xt-title/일반 editable에도 일반화 (단 `.doc-title`과 `<li>`는 제외).
- **localStorage 영속화**: 셀 텍스트/스타일/구조(rows×cols)/font-size/gap-color 모두 새로고침 후 유지. 키 prefix: `<work>-edits-v3` 등.

### text-format popover (드래그 → mouseup 시 등장)
- 폰트 토글(SF/Y&I), 색상 swatch, 알파 슬라이더, 가로 정렬(L/C/R), **세로 정렬(top/middle/bottom — 신규)**, 링크
- 일반 텍스트에서도 popover로 정렬/색상/폰트 변경 시 편집 모드 + popover 유지 (이전엔 셀에서만 가능했음)

### Cmd+B 토글
- 선택 영역 있을 때: 선택 텍스트 wrap (700 ↔ 500 토글)
- 선택 없을 때: 엘리먼트 전체 font-weight 700 ↔ 500

### 레이아웃 z-index 룰
슬라이드 내 stacking 우선순위:
- **top 영역 (`.doc-bullets`, `.title-add-list`)**: `position: relative; z-index: 3`
- **mid 영역 hover-control 블록 (`.ix-block`, `.xt-block` 등)**: `position: relative; z-index: 2`
- **mid 정적 블록 (`.dash-wrap`, `.formula-box`, `.cmp-row` 등 hover 컨트롤 없음)**: 별도 z 불필요

룰:
- mid 블록에 hover 시 absolute 컨트롤(설정 패널, resize handle, +/− 버튼 등) 띄우는 구조면 정의 시점부터 `position: relative; z-index: 2` 박을 것 — 안 그러면 top 영역(`.animate` stacking context) 또는 다른 콘텐츠가 컨트롤 hit-test 가로챔
- 반대로 top의 `.doc-bullets`에 ±버튼 4개+면 mid의 z:2가 그 클릭을 가로채는 케이스 있음 → 그래서 doc-bullets에 z:3 필요
- 새 mid 블록 컴포넌트 추가 시 둘 다 무조건 박아두는 게 안전

### CSS 토큰 변경
- `--tc-orange`: `#ec9a40` → `#e87742` (red-orange 톤)

### 신규 슬라이드 만들 때 가이드
- 표는 가능한 한 xt-block으로 (plan-table/seg-table 같은 정적 구조보단 xt 인터랙티브 권장)
- xt-block 안엔 `.xt-title.editable`, `.xt-cell.editable`만 두고 cell 내용은 텍스트로
- 페이지가 mid 영역에 들어가면 `.slide-doc.slide-segments > .xt-block`에 `margin: auto` 룰 자동 적용
- 사용자가 직접 행/열/색/폰트 추가는 인터랙션으로 — 도사는 마크업 초기 상태만 잡아주면 됨
