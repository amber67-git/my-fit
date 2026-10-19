# My Fit

주간 루틴 기반 운동 관리 앱(식단은 다음 단계). 한 페이지 웹앱(HTML 하나)이며 폰·태블릿·컴퓨터에서 같은 화면으로 동작합니다.

## 열어보기

| 방법 | 주소 | 데이터 |
|---|---|---|
| claude.ai 아티팩트 (기본) | https://claude.ai/artifact/CJtK7LTZNTx4DQJtFMWL9j | 계정 저장소에 동기화, 자동 백업 |
| GitHub Pages | 저장소 설정에서 Pages를 켜면 `https://<user>.github.io/<repo>/` | 각 기기 브라우저에만 저장 (동기화 없음) |
| 로컬 | `index.html`을 브라우저로 열기 | 각 기기 브라우저에만 저장 |

기기 간 동기화와 자동 백업은 claude.ai 링크에서만 동작합니다. GitHub Pages나 로컬에서는 Settings › JSON 내보내기/가져오기로 옮깁니다.

## 파일

- `index.html`: 독립 실행용 페이지 (GitHub Pages, 로컬)
- `artifact.html`: claude.ai 아티팩트에 게시하는 원본 (문서 골격 없이 본문만)
- `PLAN.md`: 기획 문서 (화면 구조, 데이터 모델, 플로우, 스마트 모드 규칙, 변경 이력)

## 기능 (v0.6.0)

- 4탭: Dashboard / Weekly / Monthly / Settings, 상단 EN | KO 스위치
- 운동 라이브러리 86개 (부위·도구 태그, 2~4단계 운동 방법, 흔한 실수), 추가·편집·숨기기
- 프리셋 루틴 6개 + 이번 주를 내 루틴으로 저장
- Weekly: Preset(직접 배치) / Smart(격일 배치, 주당 일수에 맞는 분할, 자동 증량)
- 운동 수행: 준비 → 운동 방법 카드 → 타이머/세트 기록 → 완료 요약
- Monthly 달력, 대시보드 요약
- 하루 1회 자동 백업(14개 보관)과 복원, JSON 내보내기/가져오기
- 앱 내 버전 안내와 변경 이력
