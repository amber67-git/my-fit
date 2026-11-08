# My Fit — 작업 규칙 (Claude용)

## 배포 흐름: 브랜치 → PR → 리뷰 반영 → 자동 머지
사용자(amber6.an)가 정한 흐름입니다. main에 직접 푸시하지 않습니다.

1. 작업은 `feat/…`, `fix/…`, `chore/…` 브랜치에서 한다. 커밋 메시지는 영어, 끝에 지정된 Co-Authored-By / Claude-Session 트레일러.
2. 푸시 후 REST로 PR을 연다: `gh api -X POST repos/amber67-git/my-fit/pulls -f title=… -f head=<branch> -f base=main -f body=…` (`gh pr create`는 GraphQL이라 이 세션에서 막힘). 본문에는 바뀐 것, 검증한 것(테스트 스위트, 그림 렌더 확인), 사용자에게 알릴 한계를 적는다.
3. CodeRabbit 리뷰를 기다린다: `gh api --paginate repos/amber67-git/my-fit/pulls/N/comments`와 `gh api --paginate repos/amber67-git/my-fit/pulls/N/reviews`에서 `coderabbitai[bot]`의 댓글을 최대 10분(30초 간격) 폴링. 연결 전이거나 10분 안에 안 오면 "리뷰 없음"으로 기록하고 진행한다.
4. 리뷰 댓글은 전부 읽고 판단한다. 실제 버그·회귀는 고쳐서 같은 브랜치에 커밋·푸시하고(다시 리뷰 대기), 오탐이나 의도된 동작은 PR 댓글로 이유를 남긴다.
5. 테스트가 통과하고 반영이 끝나면 REST로 스쿼시 머지한다: `gh api -X PUT repos/amber67-git/my-fit/pulls/N/merge -f merge_method=squash`. 브랜치는 삭제한다. GraphQL은 이 세션에서 막혀 있으니 `gh pr merge`는 쓰지 않는다.
6. 머지 후 배포 성공을 확인한다(GitHub Pages 실행, 그리고 Netlify가 연결된 뒤에는 커밋 상태의 Netlify 체크. 이 세션은 netlify.app에 접속하지 못하므로 라이브 확인은 체크 결과로 대신한다). E2E 스모크 워크플로(`.github/workflows/e2e.yml`, `tests/smoke.cjs`) 결과를 확인한다. PR 단계에서도 같은 워크플로가 돌므로 머지 전에 통과를 확인한다. 아티팩트(https://claude.ai/artifact/CJtK7LTZNTx4DQJtFMWL9j)도 같은 버전으로 갱신한다.
7. 사용자에게는 한국어로: 무엇이 바뀌었는지, 리뷰 댓글이 몇 개였고 어떻게 처리했는지, 배포 결과, 권한·네트워크 한계를 보고한다. 사용자가 직접 열어 봐야 하는 것(PR, 라이브 앱, 아티팩트, 시안 페이지, Actions 실행)은 항상 링크를 함께 붙인다.

## 검증 최소선 (머지 전)
- 소스는 `src/`(app.html, head.html, tail.html, figure/{figure,poses,figmap}.js)이고 `index.html`·`artifact.html`은 빌드 산출물이다. 앱을 고칠 때는 `src/`를 고치고 `tools/build.sh`로 빌드한다(그림 엔진 splice, dataset.js, 테스트 하네스 생성, 인라인 스크립트 블록별 `node --check`, sw.js VERSION 대조). CI가 빌드 결과와 커밋된 산출물이 같은지 확인한다.
- `tools/run-suites.sh`로 `tests/suites/*.js`(run10/run11/run12/swipe/dash19/report) 통과. 이 세션에서는 `PW_MODULE=/opt/node22/lib/node_modules/playwright PW_CHROMIUM=/opt/pw-browsers/chromium` 환경변수를 준다. 스모크는 `python3 -m http.server 8080` 띄운 뒤 `NODE_PATH=/opt/node22/lib/node_modules APP_URL=http://127.0.0.1:8080/ node tests/smoke.cjs`. 서버를 끌 때 `pkill -f`를 쓰지 않는다(자기 셸을 죽인다).
- 그림을 바꿨으면 `cd build && node ../tools/joints.js`(관절 각도)와 `node ../tools/audit.js`(바닥·겹침) 실행, 바뀐 그림은 `tools/zoom4.html?ids=…`(build/ 기준으로 열기)로 렌더해서 직접 본다.
- 앱 코드(index.html, sw.js, manifest, icons)를 바꾼 PR은 APP_VERSION, CHANGELOG, sw.js의 VERSION, README의 버전·운동 개수를 함께 올린다.
- **설정 → 가이드(`src/guide.js`)를 함께 갱신한다.** 사용자가 보는 동작·화면·주소·설치 방법이 바뀌는 PR은 해당 절(`GUIDE`)을 고치고, 큰 변경이면 `GUIDE_HISTORY` 맨 위에 한 줄을 추가하며, `GUIDE_VERSION`을 그 APP_VERSION으로, `GUIDE_DATE`를 그날로 바꾼다. 내부 수정만 있는 패치는 가이드를 안 건드려도 되지만 `tests/suites/guide.js`가 major.minor 일치와 이력 맨 위 버전을 검사하므로 minor가 오르면 반드시 갱신한다. EN·KO 두 언어를 같은 구조로 쓴다. 문서·설정만 바꾼 PR(README, PLAN, CLAUDE.md, .github, .coderabbit.yaml, docs/)은 버전을 올리지 않는다.

## 권한·한계
- 이 세션은 외부 사이트 대부분(github.io 포함)에 접속할 수 없다. 라이브 페이지 확인은 워크플로 성공 여부로 대신한다.
- CodeRabbit 계정 연결은 사용자만 할 수 있다. 연결 전에는 리뷰가 비어 있음을 보고한다.

## 주소(origin) 규칙 — 모든 앱 공통 (자세한 내용: docs/own-origin.md)
- **My Fit 주소: https://amber-my-fit.netlify.app/** (Netlify, 소유자 계정, `main`을 빌드 없이 배포). 옛 GitHub Pages 주소는 이사 안내 띠만 보여 주고 install manifest를 뺀다(`src/head.html`).
- 폰에 설치해서 쓰는 앱은 앱마다 자기 origin을 가진다. 현재 안드로이드 Chrome은 같은 origin에 웹앱을 하나만 설치하고(Chromium 버그로 보고됨: issues.chromium.org/issues/572287931), 같은 origin의 앱은 저장소를 같이 쓴다.
- ClassDesk만 `https://amber67-git.github.io/classdesk/`에 남는다. 이 origin에 다른 설치형 앱을 새로 올리지 않는다.
- 그 밖의 앱은 저장소마다 Netlify 사이트 하나 → `https://amber-<앱이름>.netlify.app`(Add new site → Import an existing project → GitHub → 이 저장소, 빌드 없는 앱은 Base directory·Build command·Publish directory 모두 비움, 만든 뒤 Make public, Change project name).
- My Fit manifest `id`는 `/app`, `start_url`·`scope`는 `./`. **id는 앞으로 절대 바꾸지 않는다.** 코드에 `/my-fit/` 같은 절대 경로를 넣지 않는다(사이트 루트에서 돌아야 함).
- 저장 키(`wwt.state.v1` 등)는 바꾸지 않는다. 서비스 워커는 `myfit-` 접두어 캐시만 지운다.
- 사용자에게 "사이트 데이터 삭제"를 안내하지 않는다(같은 origin의 다른 앱 데이터까지 지워짐).
- 안드로이드 설치 문제는 추측으로 고치지 않는다. `chrome://webapks` 화면(Manifest Id와 Scope)과 설치 창 스크린샷을 먼저 받는다.
