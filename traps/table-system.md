# aqua-dashboard xt 테이블 시스템 구현 노트

`aqua-dashboard/dashboard.html`에 구현된 셀 편집 + 다중 선택 + 헤드라인 + bullet/no-marker 시스템 + IME-안전 Shift+Enter 핸들링. 다음 디자인 톤(예: design-light) 만들 때 이 패턴 거의 그대로 가져다 쓸 수 있음.

contenteditable 함정은 [`./contenteditable.md`](./contenteditable.md) 참조.

---

## 1. 핵심 인터랙션

### 1.1 셀 click → 1번에 편집 활성

- `cursor: text !important` 인라인 강제 + window capture mousedown handler가 dashboard 차단 후 단독 처리
- 빈 셀 활성화 시 ZWSP textNode 주입 — caret이 vertical-align: middle 정상 적용 (pseudo `::after`는 caret anchor 못 함 → 상단 정렬됨)

### 1.2 다중 선택 (drag-select)

- `multiSelect = { anchor, current, cells, block, pendingMulti, active }` 상태 추적
- 사각 영역 cells에 `.xt-multi-selected` 클래스 (16% green tint), 통합 outline은 `.xt-multi-overlay` 절대 위치 div (2px outline)
- 셀 메뉴(⋮)는 선택 영역 우측 vertical center에 단일로 위치. 색상 chip 클릭 시 모든 selected 셀에 일괄 적용

### 1.3 셀 메뉴 (⋮) 구성

- **정렬 row**: 가로 3개 (left/center/right) + divider + 세로 3개 (top/middle/bottom). 현재 정렬은 inline style이 비면 `getComputedStyle`로 fallback (CSS 기본값 반영, 'start'→'left' 정규화)
- **색상 row**: none + gray + yellow + orange + red + blue + green chip
- **메뉴 유지**: 색상/정렬 클릭 시 메뉴 닫지 않음, active 상태만 갱신. 외부 클릭 시 닫힘
- **다중 선택**: 정렬은 모든 타겟 적용, 색상은 헤드라인 셀 skip. 모든 타겟이 헤드라인일 때만 색상 row 숨김
- **활성 outline 유지**: `.xt-cell.editable.is-active:not([contenteditable="plaintext-only"])` 룰로 메뉴 떠 있는 동안 선택 셀 outline (tint 없음, outline만)

### 1.4 폰트 사이즈 잠금 (data-headline="true")

- 의미: 잠금. 22px 고정. 볼드 X. 회색 배경 X. 색상 chip 자유 (헤드라인도 색칠 가능)
- Cmd+↑↓ on 잠금 셀: 무시 (셀 사이즈 조절 안 함). 일반 셀 Cmd+↑↓는 `--xt-cell-fs`만 조절
- 메뉴 라벨: "폰트 사이즈 잠금" / "폰트 사이즈 잠금 해제". 아이콘 🔒

### 1.5 다크 톤 popover 통일

- `.xt-context-menu` (행/열/셀 우클릭 메뉴), `.xt-gap-chips` (라인색상), `#text-format-popover` (텍스트 포맷) 모두 `#1f1f1f` BG + 흰색 8% border + rounded 12-16px + 진한 그림자
- 색상 chip은 22×22 rounded-rect (border-radius: 6px), 기본 흰색 15% border, hover 시 `box-shadow: 0 0 0 2px #fff`

### 1.6 drag handle (⋮⋮) 디자인 통일

- cell-menu(viewBox 4×14, cy=2,7,12 r=1.4) 패턴 기반
- row handle: viewBox 9×14, 2 cols × 3 rows. button 22×28
- col handle: viewBox 14×9, 3 cols × 2 rows. button 28×22
- 같은 r=1.4, 점 사이 간격 5(viewBox 단위)로 통일

### 1.7 빈 셀 1라인 높이 유지

- `.xt-cell:empty::after { content: '\200B' }` — pseudo ZWSP. 텍스트 있는 셀과 동일 행 높이

---

## 2. Bullet 시스템 (multi-element 구조)

**구조**:
```html
<td class="xt-cell editable bullet">
  <div class="xt-bullet-content">           <!-- wrapper, inline-block, text-align:left -->
    <div class="xt-bullet-line">텍스트</div>     <!-- 마커 있는 라인 -->
    <div class="xt-bullet-line xt-bullet-no-marker">텍스트</div>  <!-- 마커 없음 -->
  </div>
</td>
```

**중요**: wrapper는 `<div>` (`<span>` 안 `<div>`는 invalid markup → 브라우저가 normalize/auto-close해서 contenteditable 비일관).

### Enter 룰 (`.xt-cell.bullet`)

- bullet 라인 + 텍스트 + Enter → 새 bullet 라인
- no-marker 라인 + 텍스트 + Enter → 새 no-marker 라인 (plain 줄바꿈 계속)
- 빈 bullet 라인 + Enter → no-marker로 전환 (해제, 같은 셀 머무름. 마지막 라인이면 셀에서 .bullet 제거)
- 빈 no-marker 라인 + Enter → 또 다른 no-marker 추가 (plain 영역 확장)

### Shift+Enter (bullet/non-bullet 셀 통합)

- 같은 라인 안에 `\n​` (\n + ZWSP) 삽입. CSS `white-space: pre-wrap`으로 줄바꿈 렌더링
- bullet 라인이면 padding-left가 wrap된 라인도 들여쓰기 → 텍스트 정렬 유지

### "- " 트리거

- **Case 1**: 셀 전체가 "- "만 → cell.bullet 추가 + bullet 구조 생성. 정식 bullet 셀
- **Case 2**: bullet 셀 안 라인 시작 "- " → "- " 단순 제거 (이미 bullet이라 의미 없음)
- **Case 2 inline**: bullet 셀 안 라인 중간 "- " → "•" 치환 (시각용)
- **Case 3 (라인 시작 변환)**: 비-bullet 셀 + "- " 라인 시작 → 셀 전체를 bullet 구조로 변환:
  - DOM walker로 `<br>`/`\n`을 라인 break로 통합 (`<br>`는 textContent에 \n 안 남으니 walker 필수)
  - caret line idx 정확히 캡처 (sc 만나는 순간 sc 텍스트 앞/뒷부분 모두 lines 배열에 반영)
  - 그 라인이 정확히 `- `로 시작할 때만 변환. 다른 라인은 no-marker로 보존
- **Case 3 inline**: 라인 중간 "- " → 단순 "•" 치환

---

## 3. IME composition × Shift+Enter 핸들링 (한글 안전)

**문제**: 한글 IME 중 Shift+Enter 누르면:
- `keydown(229, isComposing=true)` 들어옴. 즉시 insert하면 IME가 같은 글자(예: '녕')를 새 위치에 재기록 → 글자 중복
- 그냥 return하면 swallowed (Shift+Enter 안 먹는 1회성 증상)
- compositionend 후 처리하면 commit-keydown까지 추가로 와서 2x 발화

**해결 패턴** (table.html: `doShiftEnterForCell` + `pendingShiftEnterCell`):

1. `keydown(229, isComposing=true)`: pendingShiftEnterCell에 셀 저장 + return
2. `compositionend`: 50ms 지연 후 pending 처리 (keydown(13)이 흡수했으면 skip)
3. `keydown(13, isComposing=false)`: pending이 있으면 거기서 흡수해서 처리 + pending 클리어 (compositionend setTimeout 무효화)
4. **120ms duplicate guard**: 직전 처리 후 120ms 안 keydown은 skip
5. Enter 검출은 `e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13` (IME 중 e.key가 'Process'로 와도 잡히게)

자세한 코드는 `../traps/contenteditable.md` §8 참조.

---

## 4. 함정 / 레슨

- **box-shadow transition flash**: row-selected 전환 시 spread 1000px → 2px 보간으로 100% 녹색 면이 잠깐 튐. `.xt-cell.editable { transition: background 0.12s !important }`로 box-shadow transition 제거
- **셀 border-radius 0**: 셀 사이 라운딩 홈으로 인해 row outline이 끊겨 보임 → `border-radius: 0 !important`
- **cell-menu는 shell 자식**: closest('.xt-cell')로 못 찾음. activeCell 변수 사용
- **드래그 시 메뉴+selection 정리**: 드래그 시작(이동 4px+) 순간 `deactivateAll()` 호출. mousedown 시점에 row/col index 캐시해서 deactivate 후에도 setDragVisual에서 사용 가능
- **menu action 후 메뉴 유지**: 색상/정렬은 닫지 않음. 행/열 추가/삭제 등 구조 변경만 deactivateAll
- **다중 선택 시 `:has` 활용**: `.xt-shell:has(.xt-multi-overlay.show)` 같은 `:has` 셀렉터로 부모 단에서 상태 전파
- **localStorage 캐시 invalidate**: 개발 중 stale 데이터 청소는 `EDIT_KEY` / `BULLETS_KEY` / `SHARED_SIZES_KEY` 버전 bump (예: v3→v4). 새 ID 패턴만으론 충분치 않음
- **`<br>` vs `\n` in plaintext-only ce**: Chrome plaintext-only Enter는 `<br>` 또는 `\n` 어느 쪽으로도 들어감. textContent 처리 시 `<br>`은 변환 안 됨 → DOM walker 필수

---

## 5. 유지해야 하는 것

- 설명 추가(`.xt-add-desc-link` + `.xt-desc > li`)
- 헤드라인 = 폰트 사이즈 잠금 (22px 고정, 색상 자유, 볼드 X)
- 텍스트 포맷 popover의 다크 톤 + chip 디자인 + valign
- 다중 선택 + 통합 overlay
- bullet 구조: wrapper `<div>` + multi `.xt-bullet-line` + no-marker 클래스로 plain 라인 표현
- IME-안전 Shift+Enter 핸들링 패턴
