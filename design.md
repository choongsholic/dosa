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
| `slide-cover` | 표지 | 보고형: `cover-label` + `cover-title` + `cover-author` + `cover-date` / 매뉴얼형: `cover-label` + `cover-title` 만 (3.1절 참조) |
| `slide-doc` | 일반 문서 슬라이드 | `doc-title` + `doc-bullets` + 본문 |
| `slide-segments` | 세그 명칭/정의 표 | `seg-block` × N |
| `slide-intro` | 섹션 인트로 | `slide-intro-body` + 3카드 |
| `slide-eod` | 마지막 (감사합니다) | 큰 텍스트 중앙 |

### 3.1 커버 슬라이드 — 문서 성격별 변형 (필수 결정)

문서는 두 가지 성격 중 하나. **변환 시작 시 사용자에게 한 줄 물어 결정**:

> *"이 문서는 **보고/리포트** 인가요, **매뉴얼/안내 가이드** 인가요?"*

#### 보고형 (Report)
- **언제**: 한 시점의 상태/제안/결과 공유 — 작성 책임자와 시점이 의미 있는 경우 (분석 보고서, 제안서, Q3 리뷰)
- **요소 4개**: `cover-label` · `cover-title` · `cover-author` · `cover-date`
- **패턴**: 작성팀+날짜로 책임·시점 명시
- **CSS**: `.cover-label`, `.cover-author { margin-top: auto }` 두 auto가 상하 그룹 분배

#### 매뉴얼형 (Manual)
- **언제**: 시점 독립적 가이드 — 정책·시스템·복지 안내, 사용 매뉴얼 등 *언제 봐도 유효* 한 자료
- **요소 2개**: `cover-label` · `cover-title` *만*
- **이유**: 시점 독립적이라 날짜 무의미, 카테고리 라벨이 회사 맥락도 흡수("사내 복지 안내" 자체가 회사 발신 명시)
- **CSS**: `.cover-label`에 auto margin 없이 `justify-content: center` 만으로 그룹 가운데 정렬
- **결과**: 더 심플·명확. 시각적으로 "안내 매뉴얼" 톤
- **cover-label 톤**: 검정(`var(--text)`) + 볼드(weight 700~800). 회색 약체로 두지 말 것 — 매뉴얼형은 label 이 *유일한 보조 텍스트* 라 약하면 카테고리 식별이 흐려지고 커버 전체가 단순 타이틀 박스로 보임. (2026-05-17 사용자 명시: "여긴 첫장에 서브타이틀 글자색을 그냥 검정색으로 하고 볼드를 적용했어".) 보고형은 author/date 가 위계를 분담하므로 label 회색 OK.
- **카드 헤더 라벨링 톤**: 매뉴얼형의 단계·카테고리 카드(lc-cards / pat4 / bh2·bhx-card 등)의 검정 헤더는 *영문 코드*(예: `STEP 01`, `ADI / OOO`) 가 아니라 *한글 자연어* (예: `ERP 접속`, `사유 입력`, `증빙 첨부`, `승인·지급`) 로 통일. 매뉴얼은 *읽자마자 행동·의미가 떠올라야* 하는데 영문 코드는 한 단계 해석이 필요해 진입 마찰. 보고형(데이터 분석·전략 리포트)은 영문 코드 헤더가 정보 시그널로 작동 — 그쪽은 유지. (2026-05-17 사용자 명시: 4단계 프로세스 카드 헤더를 한글로 변경.)

#### 결정 가이드 (애매할 때)
- 문서 안에 *발표 일자·제안 시점·작성팀 책임* 이 의미 있는가? → **보고형**
- 문서가 *반복적·시점 무관* 으로 참조되는가? (매년 가는 정책, 사용법) → **매뉴얼형**
- "이건 6개월 후 봐도 그대로 유효한가?" Yes → 매뉴얼형, No → 보고형

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

### 13.4 row-hl 행 강조 — 작성자가 부여

```html
<tr class="row-hl"><td>MAU</td><td>763만</td><td>800만</td></tr>
```

크림옐로우 배경. **도사는 컨버전 시 row-hl 을 자동 부여하지 않는다** — 마크업 초기 상태는 중립(배경 없음). 작성자가 브라우저에서 셀/행 선택 후 색칠 인터랙션으로 직접 강조.

- **Why**: 핵심 행 판단은 작성자 몫. 도사가 임의로 깔면 (1) 작성자 의도와 어긋날 위험, (2) 정서 민감 행(§18.1)에 색 부여 사고가 반복적으로 발생, (3) 베이스에 색칠 인터랙션이 이미 있어서 작성자가 직접 부여하는 게 더 정확. 사용자 명시 (2026-05-18).
- **예외**: 사용자가 명시적으로 "이 행 강조해줘" 라고 지시한 경우만 마크업에 직접 박음.
- 표 위 컨텍스트 라벨(§13.1)·셀 폰트 위계(§13.5·§13.7) 같은 *구조적* 디폴트는 그대로 적용 — 색 강조만 작성자 영역.

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

### 13.6.5 표 변환 시 컬럼-데이터 매핑 검증 (필수)

도사가 노션/원본 표를 plan-table·xt-block 으로 변환할 때, **헤더와 데이터 셀의 의미 매핑이 1:1 일치하는지** 변환 직후 검증한다. 한 칸씩 cycle shift / 컬럼 순서 변경 / 일부 row 누락이 발견 안 되고 그대로 박히는 사고가 반복됨.

**검증 체크리스트** (변환 직후 도사가 *반드시* 셀프 검수):

1. **헤더 단어 + 첫 행 첫 셀** 의미 일치 확인 — 예: 헤더 "경조" 의 첫 셀이 "결혼/출산/사망" 같은 *경조 종류* 인가? "본인" 같은 *대상* 이면 cycle shift 발생.
2. **각 행 전체** 가 *하나의 의미 단위* 인지 — 예: "결혼 / 본인 / 100만원 / 7일" 은 자연스러운 한 줄. "본인 / 100만원 / 7일 / 출산" 은 의미 깨짐.
3. **숫자/금액 컬럼** 의 값들이 모두 같은 단위/형식인지 — "경조금" 컬럼에 "7일" 같은 휴가 단위 섞이면 매핑 오류.
4. **원본 row 수 vs 변환 row 수** 비교 — 누락된 row 없는지.
5. **노트/주석 셀** 이 표 내부 셀에 들어가 있지 않은지 — `※`로 시작하는 보조 안내는 표 안 셀이 아니라 `formula-notes` 로(§18.3).

**Why**: 2026-05-18 condolence p7 작업에서 표 데이터가 한 칸씩 왼쪽 cycle shift 된 채로 박혀서 "본인 | 100만원 | 7일 | 출산" 같은 의미 없는 행이 됨. 사용자가 시각 검수에서 발견. 도사가 변환 직후 헤더-데이터 의미 매칭만 한 번 읽었으면 자동 탐지 가능했음.

**적용**: 변환 직후 슬라이드 첫 1~2개 행만 "헤더가 X, 데이터 첫 셀이 Y, X-Y 의미 매칭 OK?" 셀프 질문. 안 맞으면 원본 다시 보고 정정 후 박기.

### 13.7 xt-block 표 — 본문이 헤더보다 prominent (필수 룰)

**핵심 원칙**: 표는 정보 자체가 주역. 헤더는 구분자 라벨 역할이지 제목이 아님. 따라서 본문 셀이 헤더 셀보다 더 크고 굵어야 한다. (일반 웹 테이블의 "헤더가 강조" 패턴과 반대)

**왜 이렇게**:
- 헤더는 "이 컬럼이 뭔지" 한 번 알려주는 라벨. 본문에 시선이 가야 함
- 헤더가 크면 시선이 헤더에서 자꾸 멈춤 → 정보 스캔 방해
- 사용자 검증된 패턴 (2026-05-09 condolence 작업): 본문 prominent + 헤더 차분 조합이 가장 명확

**xt-block 권장 변수 (도사가 새 표 만들 때 기본값)**:

```css
.xt-block {
  --xt-cell-fs: 26px;        /* 본문 셀 — 큼, 정보가 주역 */
  --xt-headline-fs: 16px;    /* 헤더 셀 — 작은 라벨 */
}
```

**셀 본문 무게**: `font-weight: 700` (bold). 헤더는 기본(500/regular)으로 두고 색은 `var(--text-secondary)`까지 가도 OK — 라벨 톤.

**행 패딩 (여백 = 정보)**:
- 셀 vertical padding: 24~28px 권장 (xt 기본보다 더 여유)
- 빡빡할수록 스캔 어려워짐
- 행 사이 1px 라인은 var(--border) 옅게

**긴 콘텐츠 줄바꿈**: 한 셀에 긴 텍스트 들어가면 한 줄에 쥐어짜지 말고 자연스럽게 2줄로 흘려라. CSS `white-space: normal` + 적당한 max-width로 균형.

**예시 마크업**:
```html
<div class="xt-block animate delay-3" style="--xt-cell-fs: 26px; --xt-headline-fs: 16px; position: relative; z-index: 2;">
  <div class="xt-title editable" data-edit-id="xt-1-title">CATEGORY LABEL</div>
  <div class="xt-shell">
    <table class="xt"><tbody>
      <tr>
        <td class="xt-cell editable" data-headline="true">구분</td>
        <td class="xt-cell editable" data-headline="true">속성</td>
        <td class="xt-cell editable" data-headline="true">내용</td>
      </tr>
      <tr>
        <td class="xt-cell editable">결혼</td>
        <td class="xt-cell editable">본인 / 자녀</td>
        <td class="xt-cell editable">화환 or 축하선물 택 1</td>
      </tr>
    </tbody></table>
  </div>
</div>
```

**금지**: `--xt-headline-fs`를 `--xt-cell-fs`보다 크게 잡지 말 것. 반복적으로 위계 역전 사고 발생 (사용자가 명시적으로 지적함).

**동어 반복 컬럼 처리**: 모든 행이 동일한 값인 컬럼(예: "비고"가 전부 "파견직: 화환 지원")은 표 컬럼에서 빼고 표 아래 `formula-notes` 노트로 빼라. 표 폭도 줄어 가독성 ↑.

---

## 14. 베이스 HTML 위치 (작업물 생성 시)

새 작업물 만들 때:

1. 베이스 HTML(`~/.claude/skills/dosa/dosa-base/dashboard.html` 또는 `dashboard_org.html`)을 cp → 사용자 작업 공간의 새 작업물 폴더에 저장 (예: `<DOSA-ROOT>/<work>/<work>.html`)
2. localStorage 키 rename (`dashboard-` → `<work>-`) — 충돌 방지
3. 슬라이드 영역(`<div class="slides-wrapper">`~`</div>`) 안 27장을 새 콘텐츠로 교체. 카운터(slideTotal)는 JS가 자동 갱신
4. 폰트 경로(`../fonts/`)는 그대로 — 사용자 작업 공간의 `<DOSA-ROOT>/fonts/` 가리킴 (도사가 첫 호출 시 스킬에서 cp)
   - **굽기/내보내기 파일명**은 이제 `location.pathname` 에서 자동 추출됨 (2026-05-17 부로 베이스 함수 동적화). 별도 rename 불필요. 단 *과거 fork 한 작업물*은 베이스 옛 하드코딩 (`dashboard.html`) 그대로일 수 있으니 export 시 파일명 한번 확인.
5. 본 가이드의 12절(카드 매핑)·13절(표) 룰 따라 콘텐츠 변환

**새 컴포넌트 만들기 전 베이스 검색 필수**: 단계 흐름·진행 표시·카드 그리드 같은 시각 패턴이 필요할 때, 베이스 dashboard.html 에 이미 같은 컴포넌트가 있는지 *먼저 grep* 한다. 베이스에 있는 패턴이면 — 마크업·CSS·인라인 SVG 화살표 등이 검증된 상태라 그대로 가져다 쓰는 게 항상 정답. 직접 step-flow / progress-line 같은 걸 inline 으로 만들면 시각 톤·간격·정렬이 베이스와 어긋남.

- 흐름·단계 라벨 + N카드: `.lc-stages` + `.lc-cards` 결합 패턴 (베이스 p7). `lc-stages` 의 grid 컬럼 수를 카드 수와 맞추면 라벨이 카드 위에 자동 정렬되고, `:not(:first-child)::before` 의 SVG mask 가 stage 사이 화살표를 그림. 2026-05-17 condolence p7 (4단계) 에서 직접 만들다가 사용자 지적 후 lc-stages 로 교체.
- 비교/대조 2박스: `compare-rounded` 또는 `bh2`
- 4패턴 매트릭스: `pat4`
- 단순 카드 N개: `intro-cards` / `lc-cards`

---

## 15. 사용자 입력 라벨 표기 (선택)

도사는 자연어 보고 알아서 컴포넌트 매핑하지만, 사용자가 더 명확하게 의도 전달하고 싶으면 다음 라벨 표기를 요건서에 사용할 수 있다. 라벨이 있으면 도사가 우선적으로 그 컴포넌트를 사용.

### 라벨 → 컴포넌트 매핑

| 라벨 | 컴포넌트 |
|---|---|
| `[문서 제목]` `[팀명]` `[날짜]` | `slide-cover` 보고형 (3.1절) |
| `[문서 카테고리]` `[문서 제목]` (팀명·날짜 없음) | `slide-cover` 매뉴얼형 (3.1절) |
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

---

## 18. 강조의 절제 (정서·중복·보조 메모)

도사 컨버전·검수 단계에서 항상 점검해야 할 강조 위계 룰 3종. 2026-05-17 condolence 작업에서 사용자 명시 지적으로 확립.

### 18.1 정서적으로 무거운 항목에 색 강조 금지

"사망", "본인 사망" 같이 단어 자체가 정서적 무게를 가진 행/셀에 `data-row-c="yellow"`, `data-row-c="red"` 등 강조 색을 부여하지 않는다.

- **Why**: 정서적 단어를 시각 색 강조로 *이중* 강조하면 부담 가중. 특히 "본인 사망" 처럼 이용자가 직접 당사자가 되는 항목은 더더욱.
- 정보 위계 측면에서도 보통 그 행의 텍스트(예: "3,000만원 — 가장 큰 지원") 가 *크기·금액*으로 이미 자동 강조됨.
- **적용**: 베이스 dashboard.html / 참조 자료에 동일 색 강조가 있으면 컨버전 단계에서 *기본 제거*. 사용자가 따로 색 넣어달라고 명시하지 않는 한.
- 강조가 정말 필요하면 본문 `<li class="hl">` 또는 doc-bullet 텍스트 강조로 처리 — 표 내부 색 강조는 *피한다*.
- 다른 정서 민감 도메인(질병·사고·해고·실업 등) 동일 원칙.

### 18.2 doc-title 있으면 xt-title 중복 회피

슬라이드 상단 `doc-title` 이 표의 내용을 충분히 설명하는 경우, 표 위 `xt-title`(예: `CONDOLENCE BENEFIT MATRIX`, `CONDOLENCE ITEM POLICY`) 을 같이 두지 않는다.

- **Why**: 같은 슬라이드에 두 개의 제목이 위계를 두 번 잡아 시선 분산. 표 하나뿐인 슬라이드에선 doc-title 만으로도 표 의도가 명확.
- **적용**: 표가 슬라이드의 메인 콘텐츠이고 doc-title 이 그 표의 의미를 이미 담고 있으면 xt-title 제거.
- 한 슬라이드에 표가 여러 개이거나 표 + 카드 그룹이 섞여 있어 *그룹 라벨*이 필요한 경우엔 xt-title 유지.
- **xt-title 제거 방법**: 마크업에서 *통째로 삭제* 가 가장 확실. `data-show-title="false"` 속성만 박고 텍스트 그대로 두면 JS `initAll()` 의 *자동 토글 로직*(텍스트 있으면 true 로 덮어씀) 때문에 새로고침 시 다시 보임 (2026-05-17 함정). 이 자동 토글은 *마크업에 `data-show-title` 속성이 명시 안 됐을 때만* 적용되도록 보완된 상태 — 향후 케이스에서 `data-show-title="false"` 만 박아도 OK.

### 18.3 부가 안내 메모는 박스/배경 없이 보조 텍스트로

`※` 로 시작하는 슬라이드 하단 보조 안내(예: `※ 자세한 내용은 인사 ERP 또는 HR팀 문의`, `※ 결혼: 1년 내 사용 …`) 는 박스/배경 강조(예: `compare-rounded`) 가 아니라 `formula-notes` 패턴(센터정렬 회색 보조 텍스트) 으로 통일.

- **Why**: `※` 는 *주의 경고가 아니라 보강 정보*. 박스/노란 배경으로 강조하면 시선 위계가 깨짐 — 메인 콘텐츠(카드/표) 보다 보조 메모가 더 무거워 보임.
- **적용 마크업**:
  ```html
  <div class="formula-notes animate delay-4" style="margin-top:24px;">
    <p class="editable" data-edit-id="...">※ ...</p>
  </div>
  ```
- `compare-rounded`, 알록달록 박스, 노란 배경 강조 같은 컨테이너 클래스를 `※` 보조 메모에 두지 않기.
- 진짜 경고(마감 임박, 자격 박탈 등) 가 필요하면 별도 강조 가능 — 단순 안내성 메모와 구분.

### 18.4 탑 영역(doc-title + doc-bullets) 색 강조 금지

슬라이드 상단 *탑 영역* — `doc-title` + `doc-bullets` — 안에서 임의로 빨강·파랑 같은 색 강조를 부여하지 않는다. 강조가 필요하면 *검정 + 볼드* 만 사용.

- **Why**: 탑 영역은 슬라이드의 진입 시선. 여기에 빨강·파랑이 들어가면 *경고/위험 시그널* 로 잘못 읽히고, 본문의 강조(매트릭스 row-hl, accent 그린 등) 와 충돌해 시선 위계가 깨짐. 사용자 명시 (2026-05-17, p7 doc-bullets): "탑 영역에서는 빨간색 파란색 니가 임의로 색상을 넣지마. 그냥 무조건 검정으로 해."
- **베이스 CSS 함정**: 베이스 dashboard.html 의 `.doc-bullets li.hl { color: var(--negative) }` 가 빨강 — 컨버전 시 *검정으로 오버라이드*:
  ```css
  .doc-bullets li.hl { color: var(--text); }
  .doc-bullets li.hl::before { color: var(--text); }
  ```
- **적용**:
  - 탑 영역 강조는 `<li class="hl">` 의 색을 검정 + 볼드만. 빨강/파랑/그린 임의 부여 금지.
  - 본문 영역(`xt-block`·카드) 의 강조는 별개 — row-hl 노랑, accent 그린 등 의도된 강조 사용 가능.

---

## 19. 카드 본문 정렬·폰트 — 공간 활용

`bhx-card`·`lc-cards`·`bh2`·FAQ 카드 등 짧은 본문(1~2줄) 이 들어가는 카드에서 *카드 면적 대비 본문이 작고 한쪽으로 몰린 상태* 를 피한다.

- **Why**: 카드 공간이 크고 본문이 짧으면, 좌측 작은 텍스트는 *시각적 공허감*을 남김. 콘텐츠로 카드가 안 채워진 듯한 인상이라 디자인 완성도가 떨어져 보임.
- 사용자 명시 (2026-05-17, condolence p11 FAQ): "박스 내에 텍스트가 작게 좌측정렬이 되어 있는데 공간이 큰데 굳이 그렇게 표현했을 필요가 없었거든."

**결정 기준**

| 본문 길이 | 카드 폭 활용 | 권장 정렬 / 폰트 |
|---|---|---|
| 1~2줄, 카드 폭 60% 미만 | 비어있음 | **센터정렬 + 본문 폰트 크게** (예: 22px → 26~30px) |
| 3줄 이상 또는 줄별 위계 다름 | 채워짐 | 좌측정렬 자연스러움 (기본 22~24px) |
| 본문 + 강조 한 단어/숫자 조합 | 혼합 | 센터정렬 + `<strong>` 으로 키 포인트 강조 |

**적용**

- FAQ Q/A, 인용·격언, 짧은 설명 카드 → *센터정렬 기본*.
- 카드 `min-height` 가 크면(예: 380px 이상) 본문 폰트도 같이 키워서 비율 유지.
- 베이스 dashboard.html / lc-cards 패턴에 좌측+작은 폰트가 자동 적용돼 있으면 컨버전 단계에서 카드별 콘텐츠 길이 보고 *재정렬 결정* — 자동 답습 금지.
- `text-align: center` + `display: flex; align-items: center; justify-content: center` 조합으로 *수평·수직 모두 중앙* 잡아야 큰 카드에서 자연스러움. `.body` 컨테이너에 `flex:1; justify-content:center` 패턴.

### 19.1 본문 텍스트 색 위계 — 중요/부가

한 카드 안에 정보가 *중요·부가* 로 섞여 있을 때 색으로 위계를 분리한다. 모두 회색 또는 모두 검정으로 통일하지 말 것.

- **Why**: 사용자 명시 (2026-05-17, condolence p10 연락처 카드): "회색은 부가 텍스트에만 적용한거고 중요한 정보 문구는 검정색으로 수정하고 폰트도 키웠어." 정보를 같은 색·크기로 나열하면 스캔 시 *어디부터 봐야 하는지* 안 잡히고 카드가 평탄해 보임.

| 정보 종류 | 색 | 폰트 |
|---|---|---|
| **중요 정보** (전화번호, 이름, 금액, 날짜, 핵심 키워드) | `var(--text)` 검정 — 또는 `var(--accent)` 그린(특수 강조 1곳만) | 크게 (32~36px) + weight 700 |
| **부가 텍스트** (소속·직급, 운영 시간, 단위 라벨, 보조 안내) | `var(--text-secondary)` 회색 | 작게 (16~18px) |

**적용**

- 연락처·프로필 카드: 이름·전화번호는 검정 크게, 직책·소속·시간은 회색 작게.
- 금액·수치 카드: 숫자는 검정 크게, 단위·기준일은 회색 작게.
- FAQ·설명 카드: 핵심 문구는 검정, 부가 설명은 회색 — 한 줄 안에서도 `<strong style="color:var(--text)">` 로 일부만 검정 강조 가능.
- 모든 정보가 동격이면 색 위계 *불필요* — 모두 검정 또는 모두 회색으로. 위계는 정보 본질이 다를 때만 부여.

**`.attn-center` + `flex:none` 함정** (1줄/N줄 카드 정렬 어긋남)

같은 카드 그리드에서 한 카드는 1줄, 다른 카드는 2~3줄일 때 1줄 카드의 텍스트가 *카드 수직 중앙이 아니라 head 직후 위쪽* 에 머무는 함정 — `justify-content:center` 박았는데 안 먹음.

**진짜 원인**: 베이스 CSS 룰

```css
.attn-center .ba-card .body,
.attn-center .lc-card .body,
.attn-center .bhx-card > .body { flex: none; }
```

→ `.attn-center` 안의 카드 `.body` 가 *콘텐츠 높이만큼만* 차지, 카드 안에서 stretch 안 됨. body 자체가 작아 head 직후 작은 박스로 위치. body 안에서 justify-content:center 적용해도 *좁은 body 안에서의 중앙* 이라 의미 없음.

**해결**: `.body` 인라인에 `flex:1` 도 같이 박기.

```html
<div class="body" style="flex:1;justify-content:center;align-items:center;text-align:center;padding:36px 30px;">
```

2026-05-17 condolence p9 에서 함정 확인. p11 (FAQ) 은 `flex:1` 같이 박혀 있어 정상 작동, p9 카드 4개는 빠져 있어 어긋남.

**점검 체크**: `.attn-center` 안의 카드에서 본문 정렬이 어긋나면 *`.body` 의 flex 값* 부터 확인. `justify-content:center` 만으로는 부족.

**동격 판정 기준** (2026-05-17 p9 사례)

| 케이스 | 색 위계 | 예 |
|---|---|---|
| 한 카드 안 모든 줄이 *행동 필수 정보* (식별자·조건·기한 모두 알아야 신청·결정 가능) | **균일 검정**, 같은 폰트 크기 | "화환 또는 과일바스켓 / D-15 신청 가능" — 둘 다 알아야 신청 가능 |
| *식별자/숫자/이름* + *주변 맥락(소속·운영시간 등)* | **위계 부여** (검정 큼 + 회색 작음) | "황서향사원 / 02-2167-7584 / 평일 09~18시" |
| 강조 1곳만 (한 단어/숫자만 키 포인트) | 본문은 회색, 강조 부분만 `<strong style="color:var(--text)">` | "조사용품 또는 인력지원 중 **택 1**" |

자동 위계 부여 금지 — 같은 카드 안의 정보들이 *행동·의사결정 한 단위* 인지 먼저 따져본 뒤 결정.

### 19.2 본문 줄 간격 — 그룹 응집 vs 그룹 분리

한 카드 안에 여러 줄이 *한 묶음 정보* (이름+번호+시간) 이면 줄 사이 간격을 *작게* 잡아 시각적 그룹감 유지. 묶음이 둘 이상이면 `<hr>` 같은 구분선으로 *그룹 사이*만 띄움.

- **Why**: 사용자 명시 (2026-05-17, condolence p10): "여기 사이사이 간격이 너무 멀지 않아?" — `gap:14px` + 큰 폰트(34px) 디폴트 line-height 1.4~1.5 가 합쳐져 같은 묶음 정보가 *떨어져* 보임. 그룹감 사라지면 카드가 *나열* 처럼 보이고 시선이 그루핑되지 않음.
- **권장 값**:
  - 묶음 안 줄 사이: `.body { gap: 4~8px }` (디폴트 14~16px 은 큰 폰트에서 과함)
  - 그룹 사이: `<hr style="margin:Npx 0;border:0;border-top:1px solid var(--border);width:60~80%">` — 여기서 `N` 은 *컨테이너의 padding-top 과 균형*을 맞춰 잡는다. 예: `.bhx-card > .body` 는 디폴트 `padding:40px 44px` 이라 hr 위/아래 그룹 마진을 padding-top 과 맞추려면 `margin: (40 - gap) px 0` ≈ `34px 0` (2026-05-17, condolence p10 경험). 단순히 `8~12px` 박으면 *그룹 위 40 vs 아래 14* 비대칭 발생.
- **line-height 함정**: 한글이 섞인 카드 본문에선 `line-height: 1.1~1.2` 같은 좁은 행간을 *큰 폰트 한 줄에만* 적용하지 말 것. 한글 폰트는 baseline 비대칭(ascender 우세) 이라 좁은 line-height 가 *시각적 위아래 여백 비대칭* 을 만든다. 인접한 작은 폰트(디폴트 line-height 1.4) 와 line-box 비율도 달라져 *같은 gap 인데 거리 어긋나 보이는* 함정 (2026-05-17, condolence p10에서 실제 발생). 행간 줄이려면 *모든 줄에 일관* 적용하거나, 그냥 디폴트 유지하고 gap 만 조정.
- **결정 기준**: 줄 두 개를 *한 호흡으로 읽는다* → 묶음. *별개 정보* → 분리(hr 또는 더 큰 spacing).

---

## 20. 양자택일 카드 — 3층 신호로 룰 시각화

카드 N개가 *양자택일(택 1)* 관계일 때, 룰을 한 곳에만 박지 말고 *세 층* 으로 분산해서 시각화한다.

| 층 | 역할 | 예시 |
|---|---|---|
| **doc-title 끝** | 진입 즉시 룰 인지 | `사망 조사 — 추가 지원 (택 1)` |
| **doc-bullets 노트** | 평문으로 룰 확정 | "공통 품목과 별개로, 아래 둘 중 하나를 선택" |
| **각 카드 헤더 prefix** | 카드 자체에서 관계 읽힘 | `선택 1. 조사 소모품` / `선택 2. 인력 지원` |

- **Why**: 사용자 명시 (2026-05-18, condolence p6): doc-title 에 "(택 1)" + 노트만 박혀 있어도 카드 헤더가 단순 명칭(`조사 소모품` / `인력 지원`)이면 *카드 단위에선* 양자택일 관계가 안 보임. prefix 하나만 박으면 카드 두 장이 *시리즈*로 묶여 즉시 읽힘.
- **공통 그룹과의 분리**: 양자택일 카드와 *항상 제공*(공통) 카드를 같은 슬라이드에 섞지 말 것. 시각 위계가 무너짐. 슬라이드를 분리(공통 슬라이드 vs 택1 슬라이드) → §18 의 "강조의 절제" 와 같은 원리.
- **prefix 표기 변형**: `선택 N.` 이 기본. 영문 톤이면 `OPTION A` / `OPTION B`. 단순 ①②는 약함 — 시선 흐름에서 *번호만 인지되고 "택 1"은 안 인지됨*.
- **금지**: 보완 관계(둘 다 제공/세트) 카드에 "선택 1./2." prefix 박지 말 것 — 양자택일과 시각 혼동 발생.
