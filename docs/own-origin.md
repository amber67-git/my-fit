# My Fit 전용 주소(origin)로 옮기기

## 왜 옮기나 (2026-11-04 확인)
- amber67-git 계정의 GitHub Pages 사이트는 모두 `https://amber67-git.github.io/<저장소>/`라서 폴더만 다르고 **origin은 하나**입니다(ClassDesk, StudyDesk, My Fit…).
- 안드로이드 Chrome은 **같은 origin에 웹앱을 하나만** 설치합니다. 하나가 깔려 있으면 나머지는 "This app is already installed" → "Could not open app"으로 막힙니다. manifest `id`·`scope`를 폴더별로 줘도 풀리지 않았습니다(`chrome://webapks`로 확인).
- 같은 origin의 앱은 localStorage·IndexedDB·서비스 워커 캐시·저장 용량을 **같이 씁니다.** 한 앱에서 "사이트 데이터 삭제"를 누르면 **모든 앱의 데이터가 지워집니다.**

## 규칙 (모든 앱 공통)
- 폰에 설치해서 쓰는 앱은 **앱마다 자기 origin**을 가진다.
- **ClassDesk만** `https://amber67-git.github.io/classdesk/`에 남는다(수업료 데이터와 Firebase 승인 도메인). 이 origin에 다른 설치형 앱을 새로 올리지 않는다.
- 그 밖의 앱은 **Cloudflare Pages 프로젝트를 하나씩** 만들어 `https://<프로젝트명>.pages.dev`로 배포한다. 저장소 하나에 프로젝트 하나.
- 앱은 한 번에 하나씩 옮긴다. 안드로이드 설치 문제는 추측으로 고치지 말고 `chrome://webapks` 화면과 설치 창 스크린샷으로 먼저 확인한다.

## My Fit 현황
| 항목 | 값 |
|---|---|
| 옛 배포 | GitHub Pages, `main` 브랜치 루트 배포(워크플로 없음) → `https://amber67-git.github.io/my-fit/` |
| 새 배포 | Cloudflare Pages, 이 저장소만 연결, 빌드 없음, 출력 폴더 `/` → `https://<프로젝트명>.pages.dev/` |
| manifest | `id: "/app"`(**앞으로 절대 바꾸지 않는다**), `start_url: "./"`, `scope: "./"` |
| 서비스 워커 | `sw.js`(상대 경로 등록), 캐시 `myfit-shell-<버전>`·`myfit-runtime`. 자기 접두어(`myfit-shell-`)만 지운다 |
| 저장 위치 | localStorage `wwt.state.v1`(데이터), `wwt.perform`(진행 중 운동), `wwt.seenVersion`. IndexedDB 없음. 키 이름은 바꾸지 않는다 |
| 백업 | 설정 → JSON 내보내기(파일에 `app: "my-fit"`, `version`, `exportedAt`) / JSON 가져오기(파일 고르기 또는 붙여넣기, 옛 형식도 받음, 다른 앱 백업은 거부) |
| 로그인 | Firebase Google 로그인(프로젝트 `my-fit-aeac1`). 새 도메인을 승인 도메인에 추가해야 함 |
| 절대 경로 | 없음(`tests/suites/manifest.js`가 `/my-fit/` 절대 경로를 막음) |

## 소유자가 직접 할 일
1. **Cloudflare Pages 프로젝트 만들기**: https://dash.cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git
   - GitHub에서 **`amber67-git/my-fit` 저장소만** 선택
   - Production branch: `main`
   - Framework preset: **None**, Build command: **비움**, Build output directory: **`/`**
   - Save and Deploy → 나온 `https://<이름>.pages.dev` 주소를 Claude에게 알려 주기
2. **Firebase 승인 도메인 추가**: https://console.firebase.google.com/project/my-fit-aeac1/authentication/settings → Authorized domains → Add domain → `<이름>.pages.dev`
3. Google Cloud 콘솔에 이 앱용 OAuth 클라이언트를 따로 만든 적이 있다면 https://console.cloud.google.com/apis/credentials 에서 그 클라이언트의 **Authorized JavaScript origins**에 `https://<이름>.pages.dev`를 추가(따로 만든 적이 없으면 건너뜀).

## 알려진 위험: 설치한 앱의 구글 로그인
설치한 앱(standalone)은 `signInWithRedirect`를 쓰고, `authDomain`은 `my-fit-aeac1.firebaseapp.com`이라 앱 주소와 다릅니다. 제3자 저장소를 막는 브라우저에서는 승인 도메인을 추가해도 redirect 로그인이 실패할 수 있습니다(옛 주소도 같은 구성). 새 주소가 생기면 설치한 앱에서 로그인을 실제로 확인하고, 실패하면 Firebase 안내의 대안(팝업 로그인으로 전환, 또는 `/__/auth/` 경로를 새 주소에서 제공)을 적용합니다.

## 주소를 받은 뒤 Claude가 할 일
- `src/app.html`의 `const NEW_HOME=''`에 새 주소를 넣는다. 그때부터 **옛 주소에서만**(`location.hostname === 'amber67-git.github.io'`) "새 주소로 옮겼어요" 안내 띠가 [백업 받기] [새 주소 열기] 버튼과 함께 뜬다. 옛 사이트는 막지 않고, 데이터를 지우지 않는다.
- README·이 문서·CLAUDE.md에 실제 주소를 적고, Cloudflare 배포 성공(커밋 상태의 Cloudflare Pages 체크)을 확인한다.

## 기기별 이사 순서 (기기마다 한 번, 데이터는 기기마다 따로)
1. 옛 주소(`https://amber67-git.github.io/my-fit/`)를 **인터넷이 연결된 상태로** 연다.
   - 구글 로그인을 쓰면 화면 아래 상태 줄을 본다. 오프라인일 때 저장한 변경이 남아 있으면 "Firebase에 변경 올리는 중…"으로 나오고, Firestore가 서버 반영을 확인(`waitForPendingWrites`)한 뒤에만 "Firebase에 동기화됨"으로 바뀐다. **"동기화됨"이 될 때까지 기다린 뒤** 옮긴다. 이 단계 없이 옮기면 올라가지 않은 변경은 새 주소에서 보이지 않는다(v0.26.0 이상이 옛 주소에 반영된 뒤 기준).
   - 그다음 안내 띠의 **백업 받기**(또는 설정 → JSON 내보내기 → 파일로 받기)로 백업을 받아 둔다.
2. 새 주소를 연다.
   - **구글 로그인을 쓰면**: 같은 계정으로 **로그인만** 한다. 데이터는 계정에서 내려온다. **로그인한 상태에서 백업을 가져오지 않는다.** 가져오기는 계정 데이터를 백업 내용으로 바꾸고, 백업에 없는 날짜의 계획·기록·체크인·메모는 계정에서 지워진다(앱도 로그인 상태에서 가져오려 하면 한 번 더 확인한다). 1번 백업은 만일을 위한 보관용으로 둔다.
   - **로그인 없이 썼다면**: **설정 → JSON 가져오기 → 백업 파일 고르기 → 가져오기**.
3. 새 주소에서 Chrome ⋮ → **앱 설치**.
4. 옛 주소로 설치된 My Fit이 있으면 폰 설정 → 애플리케이션에서 **앱만 삭제**. 이때 **"사이트 데이터 삭제"는 절대 누르지 않는다**(같은 origin의 ClassDesk·StudyDesk 데이터까지 지워짐).
5. Chrome 주소창에 `chrome://webapks` → My Fit의 Manifest Id가 `https://<이름>.pages.dev/app`인지 확인.
