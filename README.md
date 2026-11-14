# My Fit

주간 루틴 기반 운동 관리 앱(식단은 다음 단계). 한 페이지 웹앱(HTML 하나)이며 폰·태블릿·컴퓨터에서 같은 화면으로 동작합니다.

## 열어보기

| 방법 | 주소 | 데이터 |
|---|---|---|
| claude.ai 아티팩트 (기본) | https://claude.ai/artifact/CJtK7LTZNTx4DQJtFMWL9j | 계정 저장소에 동기화, 자동 백업 |
| Netlify (메인, 앱 설치는 여기서) | https://amber-my-fit.netlify.app/ | Firebase(Google 로그인 + Firestore)에 사용자별 저장, 모든 기기 동기화, 자동 백업 |
| GitHub Pages (옛 주소) | https://amber67-git.github.io/my-fit/ | 위와 같은 Firebase 저장. 이사 안내 띠만 보이고 앱 설치는 권하지 않음 |
| 로컬 | `index.html`을 브라우저로 열기 | Firebase 설정이 있으면 동일, 없으면 기기 브라우저에만 저장 |

claude.ai 링크와 Netlify·GitHub Pages 링크는 저장소가 서로 다릅니다(각각 claude.ai 저장소 / Firebase). 한쪽만 메인으로 쓰고, 옮길 때는 Settings › JSON 내보내기/가져오기를 씁니다.

## Firebase 설정 (처음 한 번)

1. https://console.firebase.google.com 에서 프로젝트 추가 (예: `my-fit`). Google 애널리틱스는 꺼도 됩니다.
2. 왼쪽 **빌드 › Authentication › 시작하기 › 로그인 방법**에서 **Google** 사용 설정 → 저장.
3. **Authentication › 설정 › 승인된 도메인**에 `amber-my-fit.netlify.app`과 `amber67-git.github.io`를 추가. (localhost는 기본 포함) 새 주소를 빼먹으면 그 주소에서 Google 로그인이 실패합니다.
4. **빌드 › Firestore Database › 데이터베이스 만들기** → 프로덕션 모드 → 위치 선택(asia-northeast3 서울).
5. Firestore **규칙** 탭에 이 저장소의 `firestore.rules` 내용을 붙여넣고 게시.
6. **프로젝트 설정(톱니) › 일반 › 내 앱 › 웹 앱(</>) 추가** → 앱 닉네임 `my-fit` → 등록 → "구성(Config)"에 나오는 `firebaseConfig` 값을 이 저장소의 `firebase-config.js`에 붙여넣기.
7. 커밋/푸시하면 Pages에서 Google 로그인 화면이 뜹니다.

데이터 위치: `users/{uid}/app/*`, `users/{uid}/plans/{날짜}`, `users/{uid}/logs/{날짜}`, `users/{uid}/backups/*`. 규칙에 따라 본인만 읽고 씁니다.

## 파일

- `index.html`: 독립 실행용 페이지 (Netlify, GitHub Pages, 로컬). Firebase SDK와 `firebase-config.js`를 불러옴
- `firebase-config.js`: Firebase 웹 앱 구성값 (직접 붙여넣기)
- `firestore.rules`: Firestore 보안 규칙
- `manifest.webmanifest`, `sw.js`, `icons/`: 홈 화면 설치(PWA)용 매니페스트·서비스 워커·아이콘
- `artifact.html`: claude.ai 아티팩트에 게시하는 원본 (문서 골격 없이 본문만)
- `PLAN.md`: 기획 문서 (화면 구조, 데이터 모델, 플로우, 스마트 모드 규칙, 변경 이력)

## 주소
- **새 주소(설치는 여기서)**: https://amber-my-fit.netlify.app/ — Netlify, `main`을 그대로 배포합니다. 안드로이드 Chrome ⋮ → 앱 설치, 아이폰 Safari 공유 → 홈 화면에 추가.
- **옛 주소**: https://amber67-git.github.io/my-fit/ — 계속 동작하지만 이사 안내 띠가 뜨고 앱 설치를 권하지 않습니다. 같은 GitHub 주소에 ClassDesk·StudyDesk가 있어 현재 안드로이드 Chrome에서는 설치가 서로 막히기 때문입니다(Chromium 버그로 보고됨).
- 이유·규칙·소유자 할 일·기기별 이사 순서: [`docs/own-origin.md`](docs/own-origin.md). manifest `id`(`/app`)는 앞으로 절대 바꾸지 않습니다.

## 기능 (v0.41.0)

- 5탭: Dashboard / Weekly / Monthly / Report / Settings, 상단 EN | KO 스위치
- 운동 라이브러리 355개 (풀업 단계별 운동 포함: 데드 행·굽힌 팔 매달리기는 초 단위 버티기 세트; 맨몸·바벨·덤벨·케틀벨·밴드·머신·케이블·짐볼·요가·스트레칭·스포츠/야외, 부위·도구 태그, 주동근·보조근 세부 자극 부위, 2~4단계 운동 방법), 추가·편집·숨기기
- 자세 엔진이 그리는 운동 그림(운동마다 준비·동작 프레임, 도구, 화살표) + 자극 부위를 빨간색으로 보여주는 바디맵 + 단계별 동작 배지
- 근육 지도: 준비 화면과 편집창에 앞·뒤 몸 그림으로 주동근(빨강)·보조근(연한 빨강)을 표시하고, 자극되는 쪽만 보여줌. 보고서에는 기간 동안의 세트 수로 진하기가 달라지는 근육 지도. 설정에서 남성/여성 몸 그림 선택
- 프리셋 루틴 6개 + 이번 주를 내 루틴으로 저장. 적용할 때 "매주 자동 적용"을 켜면 새 주가 비어 있을 때 자동으로 채움(프리셋 모드, 남은 요일만). 설정에서 끌 수 있음
- Weekly: Preset(직접 배치) / Smart(격일 배치, 주당 일수에 맞는 분할, 자동 증량, 디로드 주(3/4/6주마다 −5~20%), 복귀 첫 주 감량(7/14/21일 이상 쉬면 −5~20%) — 설정에서 켜고 끄고 비율 조절)
- 운동 수행: 준비 → 운동 방법 카드(모든 운동의 단계별 흔한 실수 또는 팁) → 타이머/세트 기록(버티기 운동은 세트 카드의 스톱워치로 초 기록) → 완료 요약. 운동 중 횟수·무게·초를 세트 카드에서 바로 입력(±도 가능), 세트마다 지난번 기록 한 줄(누르면 복사), 완료 화면 개인 기록 배지, 운동 고르기 맨 위 최근 운동, 계획 없는 날 '지금 운동 기록하기', 세트 추가/삭제, 휴식 ±15초, 운동 추가·건너뛰기, 저장/버리기 후 나가기, 앱을 닫아도 이어서 하기
- Monthly 달력, 대시보드 요약(연속 = 주간 목표를 채운 연속 주 수, 월간 planned는 오늘까지). 하루의 시작은 새벽 4시(자정 넘긴 운동은 그날 저녁 날짜)
- 글자 크기(보통·크게) 설정, 누르는 영역 44px 이상
- 목표: 운동 기록 화면에서 한 세트 목표 무게·횟수·초와 기한(4~16주)을 정하고 대시보드에서 진행률 확인
- 준비 화면 템포·호흡 힌트, 오늘 이미 한 부위(같은 주동근이면 강조)
- 세트 상세 기록(설정에서 켜기): 세트별 RPE, 드롭세트·실패까지 표시, CSV에 포함
- 주간 리뷰: 새 주 첫 3일 동안 대시보드에 지난주 카드(세션·볼륨·시간·전주 대비, 새 개인 기록, 많이 한 부위), 이미지로 저장
- 워밍업 세트(설정에서 켜기): 무거운 운동 앞 1~3단계(기본 50%×8, 70%×5), 붙일 작업 무게 기준 20/40/60kg, 볼륨·기록 제외
- 스마트 플랜 목표 설명: 준비 화면에 오늘 목표가 오른·유지된·가벼운 이유 한 줄
- 준비 화면 '대체': 같은 주동근을 쓰는 운동으로 바꾸기, 시작 무게는 그 운동의 지난번 무게나 지금 무게로 어림한 값
- 첫 실행 안내(주당 일수 → 루틴 → 시작), 설정 → 화면 테마(자동·밝게·어둡게)
- 운동별 기록 화면: 보고서·준비 화면·항목 편집·대시보드 지난 운동 카드에서 열림(최고 기록, 변화, 추이 그래프, 최근 세션 12개)
- 보고서 탭: 기간(4주/12주/1년/전체)별 요약, 주별 볼륨·시간, 추정 1RM 성장 속도, 근력 보드(체중 대비), 부위 균형, 꾸준함, 강도·회복, 유산소, 신체, 개인 기록, 메모. 텍스트 복사·CSV 내보내기. 세트 완료 시각, 세션 RPE, 유산소 거리·심박, 오늘 체크인(체중·수면·메모), 주간 메모를 기록해 둡니다.
- 하루 1회 자동 백업(14개 보관)과 복원, JSON 내보내기/가져오기
- 설정 → 가이드: 앱 사용법, 데이터 위치, 예전 주소에서 옮기기, 자주 묻는 질문, 버전별 주요 변경 이력(`src/guide.js`, 기준 버전·FAQ 기준일 표시, EN/KO)
- 앱 내 버전 안내와 변경 이력
- Firebase: Google 로그인, Firestore 사용자별 저장, 오프라인 캐시, "계정 없이 사용" 선택 가능
- 화면 크기별 배치: 휴대폰 세로는 아래 탭, 820px 이상(태블릿 가로·데스크톱)은 옆 메뉴, 태블릿 세로는 가운데 열, 가로로 눕힌 휴대폰은 아이콘 옆 메뉴와 한 줄 버튼
- 홈 화면 앱(PWA): 안드로이드는 설정 → "홈 화면에 추가", 아이폰은 Safari 공유 → 홈 화면에 추가. 오프라인 실행, 업데이트 준비 알림, 설치된 앱에서는 리다이렉트 방식 구글 로그인
  - 설정 맨 아래 버전 밑에 "앱 id: /app"이 보이면 새 설치 설정을 받은 것입니다(v0.25.2~0.25.3에서는 `/my-fit/app`). "없음"이 보이면 두 번 새로고침하세요.
  - 다시 설치가 안 될 때("이미 설치됨" → "앱을 열 수 없음"): v0.25.2부터 앱 고유 id(`/my-fit/app`)가 있어서 지운 앱의 기록과 상관없이 설치됩니다. 브라우저에서 주소를 열고 두 번 새로고침한 뒤 ⋮ → 앱 설치. 그래도 같으면 폰 설정 → 애플리케이션 → Chrome → 강제 중지 후 다시 시도(Chrome 데이터 삭제는 앱 데이터까지 지우므로 누르지 않기).
  - v0.25.2 이전에 설치한 앱은 새 앱과 별개로 남습니다. 지우기 전에 구글 로그인을 쓰지 않았다면 설정 → JSON 내보내기로 백업. 안드로이드는 데이터가 브라우저 저장소에 있어 새 앱에서도 그대로 보이고, 아이폰은 홈 화면 앱 저장소가 따로라서 다시 설치한 뒤 JSON 가져오기(또는 같은 구글 계정 로그인).

## 그림

운동 그림은 앱 안의 자세 엔진이 직접 그립니다. 관절 각도로 자세를 정의하면 같은 비율의 아웃라인 인체(검정 외곽선, 자극 부위만 빨강)가 그려지고, 진한 회색 도구(바벨·덤벨·케틀벨·밴드·짐볼·벤치·케이블·머신)와 몸 뒤로 지나가는 얇은 동작 화살표가 함께 표시됩니다. 바닥선은 도구가 있을 때만 그립니다.

근육 지도의 몸 그림과 머리 모양은 오픈소스 그림을 씁니다(둘 다 MIT 라이선스, 상업적 사용 가능). 저작권 고지는 `src/figure/bodymap-data.js`와 `src/figure/bodymap.js` 머리말에 있고, 앱 설정 화면 아래에도 표시합니다.

- 몸(앞·뒤, 남성·여성): [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter), Copyright (c) 2022 ELABBASSI Hicham. 머리카락 조각은 빼고 같은 비율의 머리로 바꿨으며, 남녀가 같은 키·같은 머리 높이로 보이도록 표시 영역을 다시 계산했습니다.
- 남성 머리: [avataaars](https://github.com/fangpenlin/avataaars)의 ShortHairShortFlat, Copyright (c) 2017 Pablo Stanley, Fang-Pen Lin.
- 여성 머리(앞머리 + 번): 이 저장소에서 직접 그림.

## 자동 검증 연결

- **CodeRabbit (코드 리뷰)**: https://coderabbit.ai 에서 GitHub으로 로그인 → 이 저장소 추가. 설정은 `.coderabbit.yaml`(한국어 리뷰, 파일별 중점 항목). CodeRabbit은 **PR 단위**로 리뷰하므로 main 직접 푸시에는 달리지 않습니다. 브랜치에서 작업하고 PR을 열면 자동 리뷰가 붙습니다.
- **작업 흐름**: 모든 변경은 브랜치 → PR → CodeRabbit 리뷰 반영 → 스쿼시 머지 → Netlify·GitHub Pages 배포 순서로 진행합니다(규칙은 `CLAUDE.md`).
- **E2E 스모크 (Playwright)**: `.github/workflows/e2e.yml`이 PR과 main 푸시마다 저장소를 정적 서버로 띄우고 `tests/smoke.cjs`를 실행합니다(로컬 모드 진입 → 운동 추가 → 시작 → 세트 완료 → 완료 → 스와이프 취소/삭제 → 가로 스크롤·콘솔 오류 검사). 실패하면 Actions의 e2e-screenshots 아티팩트에서 화면을 볼 수 있습니다. 시나리오 전체 목록은 `docs/e2e-scenarios.md`.
- **전용 주소 이사 점검**: `tests/move.cjs`가 저장소 루트를 `/`로 두 번 띄워(새 주소=localhost, 옛 주소=amber67-git.github.io 이름을 로컬로 연결) 페이지 로드·manifest id/start_url/scope(CDP)·설치 가능성 오류 0·안내 띠는 옛 주소에서만·옛 주소 백업 → 새 주소 가져오기 왕복을 확인합니다.
- **언어 교차검증**: `tests/i18n.cjs`가 I18N 사전의 EN/KO 키·자리표시자 일치, 운동 355개의 EN/KO 이름·단계 문구를 확인하고, 모든 화면(탭 5개, 가이드, 라이브러리, 루틴, 편집, 고르기, 준비, 수행, 완료)을 EN과 KO로 렌더해 다른 언어 글자가 섞이면 실패한다(단위·약어·주소·인용문은 허용).
- **화면 크기 점검**: `tests/layout.cjs`가 데스크톱(전체 1920×1080, 분할 960×1080), 갤럭시탭 S8(가로 1280×800, 세로 800×1280), 휴대폰(세로 384×854, 가로 854×384·812×375·780×360)에서 화면 10개를 캡처하고 가로 넘침·화면 밖 요소·잘린 글자·페이지 오류가 있으면 실패합니다. 캡처는 e2e-screenshots 아티팩트의 `layout/` 폴더.
- **PageSpeed Insights**: https://pagespeed.web.dev 에 배포 URL을 넣으면 PWA·성능·접근성 점수를 외부에서 확인할 수 있습니다.

## 개발

- 소스: `src/app.html`(앱 본체), `src/head.html`·`src/tail.html`(PWA 헤더·SW 등록), `src/figure/`(자세 엔진: figure.js 렌더러, poses.js 템플릿, figmap.js 운동→그림 매핑). `index.html`과 `artifact.html`은 빌드 산출물이므로 직접 고치지 않습니다.
- 빌드: `tools/build.sh` → 그림 엔진을 app.html에 끼워 넣고 index.html/artifact.html, `build/dataset.js`, `build/test.html`(테스트 하네스)을 만듭니다.
- 테스트: `tools/run-suites.sh`(Playwright 스위트 6개), `node tests/smoke.cjs`(정적 서버에서 스모크 15단계), `node tests/persona.cjs`·`node tests/persona2.cjs`(가상 사용자 시뮬레이션 2종, 가설 48+35개). CI(`.github/workflows/e2e.yml`)가 PR과 main 푸시마다 둘 다 실행합니다.
- 그림 검사: `cd build && node ../tools/joints.js`(발목·무릎·팔꿈치 각도), `node ../tools/audit.js`(바닥·겹침), `tools/review.html`·`tools/zoom4.html`(렌더 확인).
