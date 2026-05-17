# 트리거 규칙 (도사 스킬 폴더)

이 폴더(`~/.claude/skills/dosa/`)는 도사 스킬의 단일 출처 — 변환 룰·디자인 가이드·표준 폰트·베이스 HTML이 모두 여기에 있고 GitHub 레포(`choongsholic/dosa`)와 연결돼 있다.

## 트리거

- **"도사"** → 본 폴더에서 작업 맥락 파악 (가이드 .md 변경분, 베이스 HTML 상태 등). `pending.md` 있으면 보류 작업 한 줄 보고.
- **"도사 푸시"** → `~/.claude/skills/dosa/`에서 git add + commit + push (3단계 한꺼번에). 커밋 메시지는 변경 내용 한 줄로.
- **"도사 풀"** → `~/.claude/skills/dosa/` 폴더 존재 자동 분기:
  - **폴더 있으면** → 그 폴더에서 `git pull`로 최신 받기
  - **폴더 없으면(처음 셋업)** → `git clone https://github.com/choongsholic/dosa.git ~/.claude/skills/dosa` 실행
  - 둘 다 완료 후 **`pending.md` 확인**해서 보류 작업이 있으면 사용자에게 즉시 알릴 것 (다른 환경에서 진행하기로 한 작업이라 풀한 환경이 그 환경일 수 있음).

## 작업 폴더와 분리

**원칙**: 사용자가 도사로 만든 작업물은 `<DOSA-ROOT>/<work-name>/`(예: `~/Documents/DOSA/mau-800m/`)에 저장하는 게 디폴트. 본 레포는 스킬 자체(룰·자산) 위주.

**예외**: 작업물을 회사·집 컴퓨터 사이 동기화해야 하면(=git pull 로 받기) 본 레포 안 `works/<work-name>/` 에 두면 된다. 그땐 *결과물 .html + 원본 참고 자료* 만 추적, `_renders/`·`_test-merge/`·`node_modules/` 같은 *재생성 가능 산출물*은 `.gitignore`. (2026-05-17 condolence 첫 사례 — `works/condolence/`.)

## 새 디자인 톤 추가 시

`~/.claude/skills/dosa/<new-name>.md` 생성 → 푸시. 다른 환경에서 풀하면 자동으로 톤 옵션 추가됨.
