# My Fit

주간 루틴 기반 운동 관리 앱(식단은 다음 단계). 한 페이지 웹앱(HTML 하나)이며 폰·태블릿·컴퓨터에서 같은 화면으로 동작합니다.

## 열어보기

| 방법 | 주소 | 데이터 |
|---|---|---|
| claude.ai 아티팩트 (기본) | https://claude.ai/artifact/CJtK7LTZNTx4DQJtFMWL9j | 계정 저장소에 동기화, 자동 백업 |
| GitHub Pages (메인) | https://amber67-git.github.io/my-fit/ | Firebase(Google 로그인 + Firestore)에 사용자별 저장, 모든 기기 동기화, 자동 백업 |
| 로컬 | `index.html`을 브라우저로 열기 | Firebase 설정이 있으면 동일, 없으면 기기 브라우저에만 저장 |

claude.ai 링크와 GitHub Pages 링크는 저장소가 서로 다릅니다(각각 claude.ai 저장소 / Firebase). 한쪽만 메인으로 쓰고, 옮길 때는 Settings › JSON 내보내기/가져오기를 씁니다.

## Firebase 설정 (처음 한 번)

1. https://console.firebase.google.com 에서 프로젝트 추가 (예: `my-fit`). Google 애널리틱스는 꺼도 됩니다.
2. 왼쪽 **빌드 › Authentication › 시작하기 › 로그인 방법**에서 **Google** 사용 설정 → 저장.
3. **Authentication › 설정 › 승인된 도메인**에 `amber67-git.github.io` 추가. (localhost는 기본 포함)
4. **빌드 › Firestore Database › 데이터베이스 만들기** → 프로덕션 모드 → 위치 선택(asia-northeast3 서울).
5. Firestore **규칙** 탭에 이 저장소의 `firestore.rules` 내용을 붙여넣고 게시.
6. **프로젝트 설정(톱니) › 일반 › 내 앱 › 웹 앱(</>) 추가** → 앱 닉네임 `my-fit` → 등록 → "구성(Config)"에 나오는 `firebaseConfig` 값을 이 저장소의 `firebase-config.js`에 붙여넣기.
7. 커밋/푸시하면 Pages에서 Google 로그인 화면이 뜹니다.

데이터 위치: `users/{uid}/app/*`, `users/{uid}/plans/{날짜}`, `users/{uid}/logs/{날짜}`, `users/{uid}/backups/*`. 규칙에 따라 본인만 읽고 씁니다.

## 파일

- `index.html`: 독립 실행용 페이지 (GitHub Pages, 로컬). Firebase SDK와 `firebase-config.js`를 불러옴
- `firebase-config.js`: Firebase 웹 앱 구성값 (직접 붙여넣기)
- `firestore.rules`: Firestore 보안 규칙
- `manifest.webmanifest`, `sw.js`, `icons/`: 홈 화면 설치(PWA)용 매니페스트·서비스 워커·아이콘
- `artifact.html`: claude.ai 아티팩트에 게시하는 원본 (문서 골격 없이 본문만)
- `PLAN.md`: 기획 문서 (화면 구조, 데이터 모델, 플로우, 스마트 모드 규칙, 변경 이력)

## 기능 (v0.22.0)

- 5탭: Dashboard / Weekly / Monthly / Report / Settings, 상단 EN | KO 스위치
- 운동 라이브러리 353개 (맨몸·바벨·덤벨·케틀벨·밴드·머신·케이블·짐볼·요가·스트레칭·스포츠/야외, 부위·도구 태그, 2~4단계 운동 방법), 추가·편집·숨기기
- 자세 엔진이 그리는 운동 그림(운동마다 준비·동작 프레임, 도구, 화살표) + 자극 부위를 빨간색으로 보여주는 바디맵 + 단계별 동작 배지
- 프리셋 루틴 6개 + 이번 주를 내 루틴으로 저장. 적용할 때 "매주 자동 적용"을 켜면 새 주가 비어 있을 때 자동으로 채움(프리셋 모드, 남은 요일만). 설정에서 끌 수 있음
- Weekly: Preset(직접 배치) / Smart(격일 배치, 주당 일수에 맞는 분할, 자동 증량)
- 운동 수행: 준비 → 운동 방법 카드 → 타이머/세트 기록 → 완료 요약. 운동 중 횟수·무게 즉시 수정, 세트 추가/삭제, 휴식 ±15초, 운동 추가·건너뛰기, 저장/버리기 후 나가기, 앱을 닫아도 이어서 하기
- Monthly 달력, 대시보드 요약(연속 = 주간 목표를 채운 연속 주 수, 월간 planned는 오늘까지). 하루의 시작은 새벽 4시(자정 넘긴 운동은 그날 저녁 날짜)
- 보고서 탭: 기간(4주/12주/1년/전체)별 요약, 주별 볼륨·시간, 추정 1RM 성장 속도, 근력 보드(체중 대비), 부위 균형, 꾸준함, 강도·회복, 유산소, 신체, 개인 기록, 메모. 텍스트 복사·CSV 내보내기. 세트 완료 시각, 세션 RPE, 유산소 거리·심박, 오늘 체크인(체중·수면·메모), 주간 메모를 기록해 둡니다.
- 하루 1회 자동 백업(14개 보관)과 복원, JSON 내보내기/가져오기
- 앱 내 버전 안내와 변경 이력
- Firebase: Google 로그인, Firestore 사용자별 저장, 오프라인 캐시, "계정 없이 사용" 선택 가능
- 홈 화면 앱(PWA): 안드로이드는 설정 → "홈 화면에 추가", 아이폰은 Safari 공유 → 홈 화면에 추가. 오프라인 실행, 업데이트 준비 알림, 설치된 앱에서는 리다이렉트 방식 구글 로그인

## 그림

운동 그림은 앱 안의 자세 엔진이 직접 그립니다. 관절 각도로 자세를 정의하면 같은 비율의 아웃라인 인체(검정 외곽선, 자극 부위만 빨강)가 그려지고, 진한 회색 도구(바벨·덤벨·케틀벨·밴드·짐볼·벤치·케이블·머신)와 몸 뒤로 지나가는 얇은 동작 화살표가 함께 표시됩니다. 바닥선은 도구가 있을 때만 그립니다. 외부 아이콘 세트를 쓰지 않으므로 라이선스 표기가 필요 없습니다.

## 자동 검증 연결

- **CodeRabbit (코드 리뷰)**: https://coderabbit.ai 에서 GitHub으로 로그인 → 이 저장소 추가. 설정은 `.coderabbit.yaml`(한국어 리뷰, 파일별 중점 항목). CodeRabbit은 **PR 단위**로 리뷰하므로 main 직접 푸시에는 달리지 않습니다. 브랜치에서 작업하고 PR을 열면 자동 리뷰가 붙습니다.
- **작업 흐름**: 모든 변경은 브랜치 → PR → CodeRabbit 리뷰 반영 → 스쿼시 머지 → Pages 배포 순서로 진행합니다(규칙은 `CLAUDE.md`).
- **E2E 스모크 (Playwright)**: `.github/workflows/e2e.yml`이 PR과 main 푸시마다 저장소를 정적 서버로 띄우고 `tests/smoke.cjs`를 실행합니다(로컬 모드 진입 → 운동 추가 → 시작 → 세트 완료 → 완료 → 스와이프 취소/삭제 → 가로 스크롤·콘솔 오류 검사). 실패하면 Actions의 e2e-screenshots 아티팩트에서 화면을 볼 수 있습니다. 시나리오 전체 목록은 `docs/e2e-scenarios.md`.
- **PageSpeed Insights**: https://pagespeed.web.dev 에 배포 URL을 넣으면 PWA·성능·접근성 점수를 외부에서 확인할 수 있습니다.

## 개발

- 소스: `src/app.html`(앱 본체), `src/head.html`·`src/tail.html`(PWA 헤더·SW 등록), `src/figure/`(자세 엔진: figure.js 렌더러, poses.js 템플릿, figmap.js 운동→그림 매핑). `index.html`과 `artifact.html`은 빌드 산출물이므로 직접 고치지 않습니다.
- 빌드: `tools/build.sh` → 그림 엔진을 app.html에 끼워 넣고 index.html/artifact.html, `build/dataset.js`, `build/test.html`(테스트 하네스)을 만듭니다.
- 테스트: `tools/run-suites.sh`(Playwright 스위트 6개), `node tests/smoke.cjs`(정적 서버에서 스모크 15단계), `node tests/persona.cjs`(가상 사용자 8주 시뮬레이션, 가설 47개). CI(`.github/workflows/e2e.yml`)가 PR과 main 푸시마다 둘 다 실행합니다.
- 그림 검사: `cd build && node ../tools/joints.js`(발목·무릎·팔꿈치 각도), `node ../tools/audit.js`(바닥·겹침), `tools/review.html`·`tools/zoom4.html`(렌더 확인).
