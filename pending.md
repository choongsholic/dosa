# 보류 중 / 다음 진행 예정 작업

dosa 폴더에서 시작했지만 다른 환경(다른 컴, 외부 서비스 등)에서 마저 진행해야 하는 작업 추적. 끝나면 항목 제거.

---

## Netlify 폰트 호스팅 (회사컴에서 진행 예정)

**상태**: 설계 결정만 완료, 실제 배포 미진행.

**왜 미진행**: 집컴에서는 결정만 하고 Netlify 배포는 회사컴에서 진행하기로 함.

**진행 절차**:

1. **CORS 헤더 파일 준비**
   `~/.claude/skills/dosa/fonts/` 안에 `_headers` 파일 추가:
   ```
   /*
     Access-Control-Allow-Origin: *
     Cache-Control: public, max-age=31536000
   ```

2. **Netlify Drop으로 배포**
   [app.netlify.com/drop](https://app.netlify.com/drop) 에 `fonts/` 폴더 통째로 드래그 → 자동 발급된 도메인 (예: `dosa-fonts-xyz.netlify.app`) 확인.

3. **`dashboard.html` `exportShareHTML()` 에 폰트 swap 추가**
   `var out = '<!DOCTYPE html>...'` 직전에:
   ```js
   clone.querySelectorAll('style').forEach(function (s) {
     s.textContent = s.textContent.replace(
       /url\(['"]?\.\.\/fonts\//g,
       "url('https://<발급-URL>/"
     );
   });
   ```
   `<발급-URL>`은 2단계에서 받은 도메인.

4. **검증**
   - 굽기 → 작업본은 `../fonts/` 그대로 유지 (오프라인 OK)
   - 내보내기 → `dashboard-export.html` 안 폰트 경로가 Netlify URL로 swap됐는지 확인
   - 새 탭에서 export 파일 열어 한글 폰트(You&I) 정상 렌더 확인

5. **문서 업데이트**
   - `dosa.md` 7.2 (내보내기) 섹션에 "폰트는 외부 호스팅으로 자동 swap (`<발급-URL>`)" 한 줄 박기
   - `traps/export.md` 5번 코드 예시의 placeholder URL을 실제 URL로 교체
   - 본 `pending.md` 에서 본 항목 제거

**참고**:
- 자세한 폰트 swap 패턴 + 트레이드오프(인터넷 의존, base64 인라인 대안)는 `traps/export.md` 5번 참고
- Netlify Drop은 회원가입 없이도 배포 가능, 발급된 도메인은 영구 무료
