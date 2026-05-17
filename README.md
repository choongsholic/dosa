# dosa

본인 정리 텍스트(노션·구글독스 등) → 디자인 시스템 따른 슬라이드 보고서 HTML로 변환하는 Claude Code 스킬. 본인 내부용.

## 사용

Claude Code에서:
```
/dosa
<여기에 보고서/리포트 내용 붙여넣기>
```

자세한 사용법: [`guide.md`](guide.md)

## 폴더 구조

```
dosa/
├── SKILL.md                  # /dosa 호출 시 자동 로드 (도사 행동 지침)
├── CLAUDE.md                 # 트리거 정의 ("도사" / "도사 푸시" / "도사 풀")
├── guide.md                  # 사용자 이용 가이드
├── dosa.md                   # 변환 원칙 (페이지 분할·카드/표 선택·간지 운용)
├── design.md                 # 디자인 시스템 (컴포넌트·색상·폰트·라벨)
├── pending.md                # 보류/다음 진행 작업 추적
├── traps/                    # 시행착오 노트 (작업 중 펼쳐 볼 것)
│   ├── contenteditable.md    # 편집 인터랙션·IME·캐시 함정
│   ├── export.md             # 굽기/내보내기 함정
│   ├── ix-block.md           # 이미지 컴포넌트 함정
│   ├── dashboard-layout.md   # 슬라이드 레이아웃·z-index·다크모드 함정
│   ├── transition.md         # 트랜지션·element 상태 함정
│   └── table-system.md       # xt 테이블 시스템 구현 노트 (재사용 패턴)
├── fonts/                    # 표준 폰트 (You&I + SF Pro)
└── dosa-base/
    └── dashboard.html        # 베이스 HTML (샘플이자 첫 참고 자료)
```

## 동기화 트리거 (CLAUDE.md)

- **"도사"** — 폴더 진입 시 작업 맥락 파악, 보류 작업 보고
- **"도사 푸시"** — git add + commit + push
- **"도사 풀"** — git pull + 보류 작업 안내

## 어디 가서 뭘 봐?

| 알고 싶은 것 | 파일 |
|---|---|
| 도사를 어떻게 호출/사용? | `guide.md` |
| 변환 룰 (페이지 분할·카드 선택 등) | `dosa.md` |
| 컴포넌트·색상·폰트 토큰 | `design.md` |
| 베이스 HTML 인터랙션 코드 손볼 때 | `*-traps.md` 3종 |
| 다음 환경(회사컴 등)에서 진행할 작업 | `pending.md` |
