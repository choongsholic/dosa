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

## 5. 폰트 경로 swap — share HTML만 외부 호스팅 향하게

작업본은 `../fonts/` 로컬 참조 (오프라인 OK). 내보내기 함수에서만 폰트 경로를 외부 호스팅(예: Netlify CDN)으로 string replace.

```js
clone.querySelectorAll('style').forEach(function (s) {
  s.textContent = s.textContent.replace(
    /url\(['"]?\.\.\/fonts\//g,
    "url('https://your-fonts.netlify.app/"
  );
});
```

장점:
- 작업 환경은 로컬 그대로 (CDN 죽어도 영향 X)
- 내보내기만 자동 swap → 받은 사람 어디서든 폰트 OK (인터넷 연결 시)

대안: 폰트 base64 인라인 — 100% self-contained지만 파일 사이즈 폭증 (한글 폰트 5MB+ → +33%).

CDN 호스팅 시 CORS 헤더 (`Access-Control-Allow-Origin: *`) 필수. Netlify는 `_headers` 파일에 박을 수 있다.

## 6. 카운트 디버그 함정 — CSS selector vs HTML attribute

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
