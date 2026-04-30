# 트리거 규칙 (도사 스킬 폴더)

이 폴더(`~/.claude/skills/dosa/`)는 도사 스킬의 단일 출처 — 변환 룰·디자인 가이드·표준 폰트·베이스 HTML이 모두 여기에 있고 GitHub 레포(`choongsholic/dosa`)와 연결돼 있다.

## 트리거

- **"도사"** → 본 폴더에서 작업 맥락 파악 (가이드 .md 변경분, 베이스 HTML 상태 등)
- **"도사 푸시"** → `~/.claude/skills/dosa/`에서 git add + commit + push (3단계 한꺼번에). 커밋 메시지는 변경 내용 한 줄로.
- **"도사 풀"** → `~/.claude/skills/dosa/`에서 git pull로 최신 받아오기

## 작업 폴더와 분리

**중요**: 사용자가 도사로 만든 작업물은 `<DOSA-ROOT>/<work-name>/`(예: `~/Documents/DOSA/mau-800m/`)에 저장된다. 작업물은 본 레포에 포함하지 않음 — 본 레포는 스킬 자체(룰·자산)만 추적.

## 새 디자인 톤 추가 시

`~/.claude/skills/dosa/<new-name>.md` 생성 → 푸시. 이후 다른 사용자가 풀하면 자동으로 톤 옵션 추가됨.
