// ---------- In-app guide (Settings → Guide) ----------
// Keep this current: any PR that changes what a user sees or does must update the matching section, add a line to
// GUIDE_HISTORY when the change is major, and bump GUIDE_VERSION / GUIDE_DATE (rule in CLAUDE.md, checked by tests/suites/guide.js).
const GUIDE_VERSION='0.32.0';   // the app version this guide was written against
const GUIDE_DATE='2026-11-10';  // FAQ current as of
// Section bodies: a string is a paragraph; a string starting with "• " is a bullet; {q,a} is a FAQ entry.
const GUIDE=[
 {id:'start',title:{en:'Getting started',ko:'시작하기'},en:[
  'My Fit is a weekly workout planner and tracker. It runs in the browser and can be installed on your phone like an app.',
  'What it is for — three things: ① Log with ease: tick off sets with one hand while you train and fix weight or reps on the spot. ② Train correctly: every built-in exercise starts with step-by-step figures, a map of the muscles it works, and your target next to your last result. ③ Track by looking back: the weekly, monthly and report views show volume, estimated 1RM, muscle balance and consistency so you can set the next target. Your records are yours — export them as JSON any time from Settings, and as CSV from the Report tab when you use the app in a browser (the claude.ai preview offers copy-as-text instead).',
  '• Address: https://amber-my-fit.netlify.app/ — install from here. The older GitHub address still works but only shows a moving notice.',
  '• Android: open the address in Chrome → ⋮ → Install app. iPhone: open it in Safari → Share → Add to Home Screen.',
  '• First screen: choose Google sign-in (data saved to your account and synced across devices) or "Use without account" (data stays on this device only).',
  '• Switch EN / KO with the toggle at the top right. The day starts at 04:00, so a workout finished after midnight still counts for that evening.'],
  ko:[
  'My Fit은 주간 운동 계획·기록 앱입니다. 브라우저에서 돌아가고, 휴대폰에 앱처럼 설치할 수 있습니다.',
  '이 앱의 목적은 세 가지입니다. ① 편하게 기록하기: 운동 중 한 손으로 세트를 체크하고 무게·횟수를 그 자리에서 고칩니다. ② 올바르게 운동하기: 기본 운동마다 동작 단계 그림, 자극되는 근육 지도, 지난 기록 옆의 목표를 보고 시작합니다. ③ 기록을 보며 추적하기: 주간·월간·보고서에서 볼륨, 추정 1RM, 부위 균형, 꾸준함을 확인하고 다음 목표를 정합니다. 기록은 내 것입니다. 설정에서 언제든 JSON으로, 브라우저에서 쓸 때는 보고서 탭에서 CSV로 내보낼 수 있습니다(claude.ai 미리보기에서는 CSV 대신 텍스트 복사).',
  '• 주소: https://amber-my-fit.netlify.app/ — 앱 설치는 여기서 합니다. 예전 GitHub 주소도 열리지만 이사 안내만 보여 줍니다.',
  '• 안드로이드: 크롬으로 주소를 열고 ⋮ → 앱 설치. 아이폰: Safari로 열고 공유 → 홈 화면에 추가.',
  '• 첫 화면에서 구글 로그인(계정에 저장, 모든 기기 동기화) 또는 "계정 없이 사용"(이 기기에만 저장)을 고릅니다.',
  '• 오른쪽 위 토글로 EN / KO를 바꿉니다. 하루는 새벽 4시에 시작해서, 자정을 넘겨 끝낸 운동도 그날 저녁 기록으로 남습니다.']},
 {id:'dash',title:{en:'Dashboard',ko:'대시보드'},en:[
  '• This week: workout days done out of your weekly goal. Streak counts consecutive weeks that met the goal; the current week keeps the count until it ends short.',
  '• Today: the exercises planned for today. Tap a card to start it, swipe left to delete it, or tap "+ Add exercise" to add one even after everything is done.',
  '• "Start today\'s workout" runs the planned exercises one after another. On a day with nothing planned, "Log a workout now" lets you pick an exercise and start it straight away; the picker lists the exercises you did in the last 4 weeks first.'],
  ko:[
  '• 이번 주: 주간 목표 대비 운동한 날 수. 연속(streak)은 목표를 채운 연속 주 수이고, 진행 중인 주는 끝나기 전까지 지난 연속 수를 유지합니다.',
  '• 오늘: 오늘 계획된 운동 목록. 카드를 누르면 바로 시작, 왼쪽으로 밀면 삭제, "+ 운동 추가"로 다 끝낸 뒤에도 추가할 수 있습니다.',
  '• "오늘 운동 시작"을 누르면 계획된 운동을 차례로 진행합니다. 계획이 없는 날은 "지금 운동 기록하기"로 운동을 골라 바로 시작할 수 있고, 운동 고르기 맨 위에는 최근 4주 동안 한 운동이 먼저 나옵니다.']},
 {id:'week',title:{en:'Weekly plan',ko:'주간 계획'},en:[
  '• Preset mode: place exercises on each day yourself. "Apply routine" fills the week from one of 6 presets (Push/Pull/Legs, Upper/Lower, Full body, Home, Dumbbell, Cardio + core) or a routine you saved with "Save as routine".',
  '• Tick "Apply every week" when applying a routine and a new empty week is filled automatically (preset mode only, remaining days only). Turn it off in Settings.',
  '• Smart mode: the app lays out the week for you — every other day when possible, a split that fits your days per week, and automatic progression once you complete a target. Deload weeks and a lighter first week back are in Settings → Smart mode.'],
  ko:[
  '• 프리셋 모드: 요일 칸에 운동을 직접 놓습니다. "루틴 적용"은 프리셋 6개(푸시/풀/레그, 상/하체, 전신, 홈트, 덤벨, 유산소+코어)나 "루틴으로 저장"해 둔 내 루틴으로 한 주를 채웁니다.',
  '• 루틴을 적용할 때 "매주 자동 적용"을 켜면 새 주가 비어 있을 때 자동으로 채워집니다(프리셋 모드, 남은 요일만). 설정에서 끌 수 있습니다.',
  '• 스마트 모드: 앱이 한 주를 짜 줍니다. 가능하면 격일로, 주당 일수에 맞는 분할로, 목표를 다 채우면 자동 증량. 디로드 주와 복귀 첫 주 감량은 설정 → 스마트 모드에서 켜고 끕니다.']},
 {id:'workout',title:{en:'Doing a workout',ko:'운동하기'},en:[
  '• Get-ready screen: the exercise picture, a muscle map (primary muscles red, secondary light red; only the side that works is shown), target sets × reps × weight, your last record, and 3 how-to steps. Tap the Target tile to change sets, reps or weight before you start.',
  '• Sets screen: tick each set as you finish it, change reps or weight on the spot (later sets follow), add or remove sets, rest timer with ±15 s, add another exercise or skip one mid-workout.',
  '• Timed exercises (stretching, cardio) use a countdown; on the completion screen you can correct the duration and, for cardio, enter distance and average heart rate.',
  '• Hold exercises (dead hang, flexed-arm hang): the set card has a stopwatch instead of a weight — tap "Start hold", hang, tap again when you let go. The seconds are saved as that set, the rest timer starts, and the phone buzzes once you pass your target. You can also type the seconds with the − / + buttons.',
  '• Under every step the card shows the common mistake to avoid; for stretches, cool-downs and warm-ups it shows a tip (breathing, how long to hold) instead.',
  '• With Smart mode, a line under the target says why it is what it is: weight up because you hit every rep last time, the same because you fell short, or lighter in a deload week or the first week back. Changing the target yourself removes the line.',
  '• Swap: on the get-ready screen, "Swap" lists exercises that work the same main muscles, best matches first. Pick one and it replaces the planned exercise with its own targets — useful when a machine is taken or you have different equipment.',
  '• Faster logging: tap a number on a set card to type reps, weight or seconds (later sets follow). Under each set you see what you did last time — tap that line to copy it. Beating your best shows a "New personal record" badge on the completion screen.',
  '• Completion: how it felt (1–5) and how hard it was (RPE 6–10) feed the report. You can leave a workout safely: save or discard, and resume after closing the app.'],
  ko:[
  '• 준비 화면: 운동 그림, 근육 지도(주동근 빨강·보조근 연한 빨강, 자극되는 쪽만 표시), 목표 세트×횟수×무게, 지난 기록, 운동 방법 3단계. 목표 타일을 누르면 시작 전에 세트·횟수·무게를 바꿀 수 있습니다.',
  '• 세트 화면: 세트를 끝낼 때마다 체크, 횟수·무게 즉시 수정(뒤 세트가 따라감), 세트 추가/삭제, 휴식 타이머 ±15초, 운동 중 다른 운동 추가·건너뛰기.',
  '• 시간형 운동(스트레칭·유산소)은 카운트다운으로 진행하고, 완료 화면에서 시간을 고치거나 유산소는 거리·평균 심박을 넣을 수 있습니다.',
  '• 버티기 운동(데드 행, 굽힌 팔 매달리기): 세트 카드에 무게 대신 스톱워치가 있습니다. "버티기 시작"을 누르고 매달렸다가 손을 놓을 때 다시 누르면 그 초가 세트로 저장되고 휴식 타이머가 시작되며, 목표 초를 넘기면 진동이 한 번 옵니다. − / + 버튼으로 초를 직접 넣어도 됩니다.',
  '• 단계 카드마다 동작 설명 아래에 피해야 할 흔한 실수가 보이고, 스트레칭·쿨다운·워밍업은 실수 대신 팁(호흡, 유지 시간)이 보입니다.',
  '• 스마트 모드에서는 목표 아래 한 줄로 그 이유가 나옵니다. 지난번 모든 횟수를 채워 무게가 올랐는지, 못 채워 그대로인지, 디로드 주나 복귀 첫 주라 가벼운지 알려 줍니다. 목표를 직접 고치면 이 줄은 사라집니다.',
  '• 대체: 준비 화면에서 "대체"를 누르면 같은 주동근을 쓰는 운동이 잘 맞는 순서로 나옵니다. 고르면 그 운동의 기본 목표로 계획이 바뀝니다. 기구가 사용 중이거나 다른 도구밖에 없을 때 쓰세요.',
  '• 빠른 기록: 세트 카드의 숫자를 누르면 횟수·무게·초를 바로 입력할 수 있고(뒤 세트가 따라감), 세트마다 지난번 기록이 한 줄 보여 누르면 그 값으로 채워집니다. 최고 기록을 넘기면 완료 화면에 "개인 기록 갱신" 배지가 뜹니다.',
  '• 완료 화면의 컨디션(1~5)과 강도(RPE 6~10)는 보고서에 쓰입니다. 운동 중 나가도 저장/버리기를 고를 수 있고, 앱을 닫았다가 이어서 할 수 있습니다.']},
 {id:'library',title:{en:'Exercise library',ko:'운동 라이브러리'},en:[
  '• Settings → Exercise library: 355 built-in exercises (bodyweight, barbell, dumbbell, kettlebell, band, machine, cable, stability ball, yoga, stretching, sports & outdoor) with filters by type, muscle and equipment, and Korean search.',
  '• Every exercise lists its primary and secondary muscles. You can add your own exercises, edit built-ins, or hide ones you never use.'],
  ko:[
  '• 설정 → 운동 라이브러리: 기본 운동 355개(맨몸·바벨·덤벨·케틀벨·밴드·머신·케이블·짐볼·요가·스트레칭·스포츠/야외). 종류·부위·도구 필터와 한글 검색.',
  '• 운동마다 주동근·보조근이 적혀 있습니다. 내 운동을 추가하거나 기본 운동을 고치고, 안 쓰는 운동은 숨길 수 있습니다.']},
 {id:'report',title:{en:'Report',ko:'보고서'},en:[
  '• Pick a period (4 wk / 12 wk / 1 yr / all). Sections: summary, week-by-week volume and minutes, growth by estimated 1RM, strength board (× body weight), muscle balance with a weekly muscle map and sets by specific muscle, consistency, effort & recovery, cardio, body, personal records, notes.',
  '• Today\'s check-in (body weight, sleep, note) and the weekly note are entered just below the summary.',
  '• Tap an exercise in growth, strength board or personal records to open its history: best, change since the first session, a trend line (estimated 1RM, or most reps / seconds / minutes) and the last 12 sessions. The same screen opens from the "Last" tile before an exercise, "History" in the item editor and the last-workout card on the dashboard.',
  '• "Copy as text" and "Export CSV" give you the numbers for a spreadsheet. Sections that need more data say what is missing.'],
  ko:[
  '• 기간(4주/12주/1년/전체)을 고릅니다. 항목: 요약, 주별 볼륨·시간, 추정 1RM 성장 속도, 근력 보드(체중 대비), 부위 균형(주간 근육 지도와 세부 부위별 세트), 꾸준함, 강도·회복, 유산소, 신체, 개인 기록, 메모.',
  '• 오늘 체크인(체중·수면·메모)과 주간 메모는 요약 바로 아래에서 적습니다.',
  '• 성장 속도·근력 보드·개인 기록에서 운동을 누르면 그 운동의 기록이 열립니다. 최고 기록, 첫 세션 대비 변화, 추이 그래프(추정 1RM, 또는 최다 횟수·초·분), 최근 세션 12개가 보입니다. 운동 전 준비 화면의 "지난번" 칸, 항목 편집의 "기록 보기", 대시보드의 지난 운동 카드에서도 같은 화면이 열립니다.',
  '• "텍스트 복사"와 "CSV 내보내기"로 숫자를 스프레드시트로 가져갈 수 있습니다. 데이터가 더 필요한 항목은 무엇이 부족한지 알려 줍니다.']},
 {id:'settings',title:{en:'Settings',ko:'설정'},en:[
  '• Goals: weekly goal (days), rest between sets. Smart mode: alternate days, split, auto progression and weight step, deload week (every 3/4/6 weeks, −5…20 %), lighter first week back (after 7/14/21+ days, −5…20 %).',
  '• Language, unit (kg/lb converts every stored weight), body figure (male/female) for the muscle map.',
  '• Data: Export JSON (copy or download a backup file), Import JSON (choose a file or paste; the app asks before replacing data), automatic daily backups (14 kept) and restore when signed in, reset.',
  '• Theme: Auto follows the phone\'s light / dark setting; Light or Dark keeps one look. The first time you open the app it asks how many days you train and which routine to start with — you can skip it.',
  '• The version row opens "What\'s new"; the app id line under it shows which install settings your phone received. On a tablet or desktop the side menu also shows the version and its release date at the bottom left — tap it for the same list.'],
  ko:[
  '• 목표: 주간 목표(일수), 세트 간 휴식. 스마트 모드: 격일 배치, 분할, 자동 증량과 무게 단위, 디로드 주(3/4/6주마다 −5~20%), 복귀 첫 주 감량(7/14/21일 이상 쉬면 −5~20%).',
  '• 언어, 단위(kg/lb 전환 시 저장된 무게가 모두 변환), 근육 지도의 몸 그림(남성/여성).',
  '• 데이터: JSON 내보내기(복사 또는 백업 파일 다운로드), JSON 가져오기(파일 고르기 또는 붙여넣기, 바꾸기 전에 한 번 확인), 로그인 시 하루 1회 자동 백업(14개 보관)과 복원, 초기화.',
  '• 화면 테마: 자동은 휴대폰의 밝게·어둡게 설정을 따르고, 밝게·어둡게는 한 가지로 고정합니다. 앱을 처음 열면 주당 운동 일수와 시작할 루틴을 묻는 안내가 나오며 건너뛸 수 있습니다.',
  '• 버전 줄을 누르면 "새로운 기능"이 열리고, 그 아래 앱 id 줄은 휴대폰이 받은 설치 설정을 보여 줍니다. 태블릿·데스크톱에서는 옆 메뉴 왼쪽 아래에도 버전과 업데이트 날짜가 보이고, 누르면 같은 목록이 열립니다.']},
 {id:'data',title:{en:'Where your data lives',ko:'데이터는 어디에 있나'},en:[
  '• Signed in with Google: in the app\'s Firebase project under your user ID, synced to every device you sign in on. The status line at the bottom of Settings says "Uploading changes…" until every change has reached the server, then "Synced to Firebase".',
  '• Without an account: in this browser\'s storage on this device only. A different browser, device or address is a different storage — move data with Export / Import JSON.',
  '• Privacy: My Fit has no ads and no tracking. It keeps your plans, workout logs, check-ins (body weight, sleep, notes) and settings — in this browser and, if you sign in with Google, in the app\'s Firebase project under your user ID. Nothing is sent anywhere else. Export JSON or CSV any time.',
  '• Deleting data: Settings → Reset all data deletes plans, workout logs, check-ins, notes and your exercise edits — on this device, and in your account if you are signed in. It keeps saved routines, settings and the automatic backups (the last 14 daily snapshots of a signed-in account). Signing out or removing the app does not delete what is stored in your account; to have the account\'s data and backups removed completely, contact the app\'s support.',
  '• Never use the browser\'s "Clear site data" for this address: it also wipes other apps that share the address (on the old GitHub address, ClassDesk and StudyDesk).'],
  ko:[
  '• 구글 로그인: 앱의 Firebase 프로젝트에 사용자별로 저장되고 로그인한 모든 기기에 동기화됩니다. 설정 맨 아래 상태 줄이 "변경 올리는 중…"이면 아직 서버에 다 안 올라간 것이고, "Firebase에 동기화됨"이면 끝난 것입니다.',
  '• 계정 없이 사용: 이 기기의 이 브라우저 저장소에만 있습니다. 다른 브라우저·기기·주소는 저장소가 다르므로 JSON 내보내기/가져오기로 옮깁니다.',
  '• 개인정보: My Fit에는 광고와 추적이 없습니다. 계획·운동 기록·체크인(체중·수면·메모)·설정만 이 브라우저에 저장하고, 구글로 로그인하면 앱의 Firebase 프로젝트에도 사용자별로 저장합니다. 다른 곳으로는 보내지 않습니다. JSON·CSV로 언제든 내보낼 수 있습니다.',
  '• 데이터 삭제: 설정 → 모든 데이터 초기화는 계획·운동 기록·체크인·메모·운동 편집 내용을 이 기기에서, 로그인했다면 계정에서도 지웁니다. 저장한 루틴, 설정, 자동 백업(로그인 계정의 최근 14일치 스냅샷)은 남습니다. 로그아웃하거나 앱을 지워도 계정에 저장된 데이터는 지워지지 않으니, 계정 데이터와 백업까지 모두 지우려면 앱 지원 창구에 요청하세요.',
  '• 이 주소에 대해 브라우저의 "사이트 데이터 삭제"는 누르지 마세요. 같은 주소를 쓰는 다른 앱(예전 GitHub 주소의 ClassDesk·StudyDesk) 데이터까지 지워집니다.']},
 {id:'move',title:{en:'Moving from the old address',ko:'예전 주소에서 옮기기'},en:[
  'The old address (amber67-git.github.io/my-fit) shares its storage and its "installed app" slot with other apps, which is why installing there failed. Do this once per device:',
  '• 1. Open the old address online where you used it (on iPhone, inside the home-screen app if that is where you worked). Signed in with Google: wait until the status line says "Synced to Firebase" (it only means this device\'s changes were sent), then check that your records look complete, including days logged on other devices; if you cannot confirm that, put off signing in at the new address. Without an account: nothing to wait for. Either way, download a backup from the notice.',
  '• 2. Open the new address. With Google sign-in, just sign in — do not import. Without an account, Settings → Import JSON → choose the backup file. If you already logged workouts at the new address without an account and now want to sign in, export them first: signing in loads the account\'s records and local ones are not merged.',
  '• 3. Check your data is there, then install the app from the new address. On iPhone the home-screen app has its own storage, separate from Safari: open the installed app and check again — signed in with Google, sign in inside it; without an account, import the backup file again inside it. If Google sign-in does not complete inside the installed app (iOS can block it there), choose "Use without account" and import the backup file inside it. Workouts logged there stay on this device only and are not synced to the account; log workouts that must sync in Safari. Before you later sign in inside that app, export its data, and also export the account data from Safari: wait for "Synced to Firebase" (it only means your own changes were sent), check that the records look complete, then export; then sign in while online. If you cannot confirm the records are complete, put off the sign-in. Records are not merged: signing in loads the account\'s records, and on a bad connection local records can overwrite account records for the same dates.',
  '• 4. Delete the old My Fit app from the phone (app only — never "Clear site data"). In Chrome, chrome://webapks should show My Fit with the new address.'],
  ko:[
  '예전 주소(amber67-git.github.io/my-fit)는 다른 앱과 저장소와 "설치된 앱" 자리를 같이 써서 설치가 막혔습니다. 기기마다 한 번씩 아래대로 합니다.',
  '• 1. 데이터를 쓰던 곳(아이폰은 홈 화면 앱에서 썼다면 그 앱 안)에서 예전 주소를 인터넷 연결 상태로 엽니다. 구글 로그인을 쓰면 상태 줄이 "Firebase에 동기화됨"이 될 때까지 기다리고(이 기기의 변경이 전송됐다는 뜻일 뿐입니다), 다른 기기에서 기록한 날까지 기록이 빠짐없이 보이는지 확인합니다. 확인할 수 없으면 새 주소에서의 로그인을 미루세요. 계정 없이 썼다면 기다릴 것 없이 바로 진행합니다. 어느 쪽이든 안내 띠에서 백업을 받아 둡니다.',
  '• 2. 새 주소를 엽니다. 구글 로그인을 쓰면 로그인만 하고 가져오기는 하지 않습니다. 계정 없이 썼다면 설정 → JSON 가져오기 → 백업 파일 고르기. 새 주소에서 이미 계정 없이 운동을 기록했는데 이제 로그인하려면 먼저 내보내 두세요. 로그인하면 계정의 기록을 불러오고 로컬 기록은 합쳐지지 않습니다.',
  '• 3. 데이터가 다 보이는지 확인한 뒤 새 주소에서 앱을 설치합니다. 아이폰의 홈 화면 앱은 Safari와 저장소가 따로라서, 설치한 앱을 열어 다시 확인합니다. 구글 로그인은 그 앱 안에서 로그인하고, 계정 없이 쓰면 그 앱 안에서 백업 파일을 다시 가져옵니다. 설치한 앱 안에서 구글 로그인이 끝나지 않으면(iOS가 막을 수 있음) "계정 없이 사용"을 고르고 그 앱 안에서 백업 파일을 가져옵니다. 거기서 기록한 운동은 이 기기에만 남고 계정에 동기화되지 않으니, 동기화가 필요한 운동은 Safari에서 기록합니다. 나중에 그 앱 안에서 로그인하려면 먼저 그 앱의 데이터를 내보내고, Safari에서도 계정 데이터를 따로 내보냅니다. "Firebase에 동기화됨"은 내 변경이 전송됐다는 뜻일 뿐이니, 그 표시가 뜬 뒤 기록이 빠짐없이 보이는지 확인하고 내보내세요. 그런 다음 인터넷이 연결된 상태에서 로그인합니다. 기록이 다 있는지 확인할 수 없으면 로그인을 미루세요. 기록은 합쳐지지 않습니다. 로그인하면 계정의 기록을 불러오고, 연결이 나쁘면 같은 날짜의 계정 기록이 로컬 기록으로 덮어써질 수 있습니다.',
  '• 4. 예전 My Fit 앱을 휴대폰에서 지웁니다(앱만, "사이트 데이터 삭제"는 금지). 크롬 chrome://webapks에 My Fit이 새 주소로 나오면 성공입니다.']},
 {id:'faq',title:{en:'FAQ',ko:'자주 묻는 질문'},en:[
  {q:'Chrome says "This app is already installed" and then "Could not open app".',a:'Another app on the same address is installed (current Android Chrome allows one web app per address). Install from the new address instead; then remove the old My Fit from Settings → Apps. Do not clear site data.'},
  {q:'The new address is empty.',a:'Each address has its own storage. Sign in with the same Google account, or import the backup you downloaded at the old address.'},
  {q:'My streak dropped although I worked out.',a:'Streak counts weeks that met the weekly goal, not days. Check the goal in Settings; a week in progress keeps the previous count until it ends.'},
  {q:'A workout after midnight landed on the wrong day.',a:'The day starts at 04:00. Anything finished before 04:00 belongs to the previous day on purpose.'},
  {q:'Weights look wrong after switching kg/lb.',a:'Switching converts every stored weight and body weight. Switch back if you did not mean to.'},
  {q:'What does "Deload week" / "Back after a break" on the weekly card mean?',a:'Smart mode lowered this week\'s weights by your chosen percentage: after several weeks on goal, or after a break longer than the days you set. Both can be turned off in Settings.'},
  {q:'The muscle map shows only the front (or only the back).',a:'It shows the side where the primary muscles are. Exercises that work both (e.g. squats) show both; the weekly map in the report always shows both.'},
  {q:'Is the app updated automatically?',a:'Yes. When a new version is ready the app tells you; reload or reopen it. The version is at the bottom of Settings.'}],
  ko:[
  {q:'크롬이 "This app is already installed"라고 하고 누르면 "Could not open app"이 떠요.',a:'같은 주소의 다른 앱이 설치돼 있어서입니다(현재 안드로이드 크롬은 주소당 웹앱 하나만 설치). 새 주소에서 설치하고, 예전 My Fit은 설정 → 애플리케이션에서 지우세요. 사이트 데이터 삭제는 하지 마세요.'},
  {q:'새 주소를 열었더니 비어 있어요.',a:'주소마다 저장소가 따로입니다. 같은 구글 계정으로 로그인하거나, 예전 주소에서 받은 백업을 가져오세요.'},
  {q:'운동했는데 연속(streak)이 줄었어요.',a:'연속은 날이 아니라 주간 목표를 채운 주 수입니다. 설정의 주간 목표를 확인하세요. 진행 중인 주는 끝나기 전까지 지난 연속 수를 유지합니다.'},
  {q:'자정 넘겨 한 운동이 다른 날로 들어갔어요.',a:'하루는 새벽 4시에 시작합니다. 새벽 4시 전에 끝낸 운동은 일부러 전날로 기록합니다.'},
  {q:'kg/lb를 바꿨더니 무게가 이상해요.',a:'전환하면 저장된 무게와 체중이 모두 변환됩니다. 실수였다면 다시 바꾸면 됩니다.'},
  {q:'주간 카드의 "디로드 주" / "복귀 첫 주"가 뭔가요?',a:'스마트 모드가 이번 주 무게를 정한 비율만큼 낮춘 것입니다. 목표를 몇 주 연속 채운 뒤, 또는 정한 일수보다 오래 쉰 뒤에 적용됩니다. 둘 다 설정에서 끌 수 있습니다.'},
  {q:'근육 지도가 앞(또는 뒤)만 보여요.',a:'주동근이 있는 쪽만 보여 줍니다. 스쿼트처럼 앞뒤 모두 쓰는 운동은 둘 다 보이고, 보고서의 주간 지도는 항상 앞뒤를 보여 줍니다.'},
  {q:'앱은 자동으로 업데이트되나요?',a:'네. 새 버전이 준비되면 앱이 알려 주고, 새로고침하거나 다시 열면 적용됩니다. 버전은 설정 맨 아래에 있습니다.'}]}
];
// Curated major changes (newest first). The full list is in "What's new".
const GUIDE_HISTORY=[
 {v:'0.32',date:'2026-11-10',en:'Smart plans explain each target on the get-ready screen (up, same, deload, first week back).',ko:'스마트 플랜이 준비 화면에서 목표의 이유를 알려 줌(증량·유지·디로드·복귀 첫 주).'},
 {v:'0.31',date:'2026-11-10',en:'Swap an exercise for one that works the same main muscles, from the get-ready screen.',ko:'준비 화면에서 같은 주동근을 쓰는 운동으로 바꾸기(대체).'},
 {v:'0.30',date:'2026-11-10',en:'First-run setup (days a week → routine → start), Settings → Theme (auto, light, dark), privacy notes in this guide.',ko:'첫 실행 안내(주당 일수 → 루틴 → 시작), 설정 → 화면 테마(자동·밝게·어둡게), 이 가이드에 개인정보 안내.'},
 {v:'0.29',date:'2026-11-10',en:'Exercise history screen (best, change, trend, recent sessions) from the report, the get-ready screen, the item editor and the dashboard; report summary first; last-workout card.',ko:'운동별 기록 화면(최고 기록, 변화, 추이, 최근 세션)을 보고서·준비 화면·항목 편집·대시보드에서 열 수 있음. 보고서 요약을 맨 위로. 지난 운동 카드.'},
 {v:'0.28',date:'2026-11-10',en:'Faster logging: type values into the set card, see and copy last time\'s set, personal-record badge, recent exercises at the top of the picker, "Log a workout now" on empty days.',ko:'빠른 기록: 세트 카드에 값 바로 입력, 지난번 세트 보기·복사, 개인 기록 배지, 운동 고르기 맨 위 최근 운동, 빈 날 "지금 운동 기록하기".'},
 {v:'0.27',date:'2026-11-10',en:'Hold exercises (dead hang, flexed-arm hang) log seconds per set with a stopwatch on the set card; pull-up progression exercises added; step cards show the common mistake, or a tip for stretches and cool-downs.',ko:'버티기 운동(데드 행, 굽힌 팔 매달리기)은 세트 카드의 스톱워치로 초를 기록. 풀업 단계별 운동 추가. 단계 카드에 흔한 실수(스트레칭·쿨다운은 팁) 표시.'},
 {v:'0.26',date:'2026-11-08',en:'My Fit moved to its own address (amber-my-fit.netlify.app) so it installs as its own app; backups name the app and version; every import asks before replacing data; this guide was added.',ko:'My Fit이 전용 주소(amber-my-fit.netlify.app)로 이사해 자기 앱으로 설치됨. 백업 파일에 앱 이름·버전, 모든 가져오기는 바꾸기 전에 확인, 이 가이드 추가.'},
 {v:'0.25',date:'2026-11-03',en:'Muscle map on the get-ready screen, editor and report; male/female body figure; new app icon; layouts checked for desktop, tablet and phone landscape; reinstall fixes.',ko:'준비 화면·편집창·보고서에 근육 지도, 남성/여성 몸 그림, 새 앱 아이콘, 데스크톱·태블릿·휴대폰 가로 배치 점검, 다시 설치 문제 수정.'},
 {v:'0.24',date:'2026-11-01',en:'Every exercise lists its primary and secondary muscles; report breaks sets down by specific muscle.',ko:'모든 운동에 주동근·보조근 표시, 보고서에 세부 부위별 세트.'},
 {v:'0.23',date:'2026-10-31',en:'Smart mode: deload week and a lighter first week back, both adjustable in Settings.',ko:'스마트 모드: 디로드 주와 복귀 첫 주 감량, 설정에서 조절.'},
 {v:'0.22',date:'2026-10-28',en:'Streak counts weeks that met the goal; routines can repeat every week; the day starts at 04:00; smart plan keeps your last weight after an incomplete session.',ko:'연속은 목표를 채운 주 수로, 루틴 매주 반복, 하루 시작 새벽 4시, 미완료 세션 뒤에도 마지막 무게 유지.'},
 {v:'0.21',date:'2026-10-27',en:'Report tab (volume, growth, strength, balance, consistency, effort, cardio, body, records) with check-ins, RPE, cardio distance and heart rate, CSV export.',ko:'보고서 탭(볼륨·성장·근력·균형·꾸준함·강도·유산소·신체·기록)과 체크인, RPE, 유산소 거리·심박, CSV 내보내기.'},
 {v:'0.20',date:'2026-10-22',en:'68 Samsung Health activity types under "Sports & outdoor"; figures obey ankle and knee range of motion.',ko:'삼성헬스 운동 68종("스포츠·야외"), 그림이 발목·무릎 가동범위를 지킴.'},
 {v:'0.19',date:'2026-10-22',en:'28 machine and cable exercises; done exercises show a green check; "Add exercise" always available today.',ko:'머신·케이블 운동 28개, 완료는 초록 체크로, 오늘 운동 추가는 항상 가능.'},
 {v:'0.17',date:'2026-10-22',en:'Installable home-screen app (offline, update notice); every dashboard card is tappable; swipe to delete.',ko:'홈 화면 설치 앱(오프라인, 업데이트 알림), 대시보드 카드 탭·스와이프 삭제.'},
 {v:'0.10',date:'2026-10-19',en:'Phone-first workout screen: big set cards, change reps and weight on the spot, resume after closing the app.',ko:'폰 우선 운동 화면: 큰 세트 카드, 횟수·무게 즉시 수정, 앱을 닫아도 이어서 하기.'}
];
function renderGuide(){ const ko=S.settings.lang==='ko'; const L=k=>ko?k.ko:k.en;
  const item=x=>typeof x==='string'?(x.startsWith('• ')?`<li>${esc(x.slice(2))}</li>`:`<p>${esc(x)}</p>`):`<dt>${esc(x.q)}</dt><dd>${esc(x.a)}</dd>`;
  const body=arr=>{ let h='',list=false,dl=false; arr.forEach(x=>{ const isLi=typeof x==='string'&&x.startsWith('• '), isDl=typeof x!=='string'; if(list&&!isLi){h+='</ul>';list=false;} if(dl&&!isDl){h+='</dl>';dl=false;} if(isLi&&!list){h+='<ul>';list=true;} if(isDl&&!dl){h+='<dl class="faq">';dl=true;} h+=item(x); }); if(list)h+='</ul>'; if(dl)h+='</dl>'; return h; };
  const stamp=(ko?'기준 버전: v':'Guide written against version: v')+GUIDE_VERSION+' · '+(ko?'FAQ 기준일: ':'FAQ current as of: ')+GUIDE_DATE+(GUIDE_VERSION!==APP_VERSION?' · '+(ko?'앱 버전 v'+APP_VERSION:'app is v'+APP_VERSION):'');
  view.innerHTML=`<div class="stack guide">
   <div class="row"><button class="icon-btn" data-act="back" aria-label="${esc(t('a11y_back'))}">${ICO.back}</button><div class="grow"><h2>${esc(t('guide'))}</h2><div class="cap num">${esc(stamp)}</div></div></div>
   <div class="chips">${GUIDE.map(s=>`<a class="chip" href="#g-${s.id}">${esc(L(s.title))}</a>`).join('')}<a class="chip" href="#g-history">${esc(t('guide_history'))}</a></div>
   ${GUIDE.map(s=>`<section class="rpt-sec" id="g-${s.id}"><h3>${esc(L(s.title))}</h3>${body(ko?s.ko:s.en)}</section>`).join('')}
   <section class="rpt-sec" id="g-history"><h3>${esc(t('guide_history'))}</h3><div class="cap">${esc(t('guide_history_sub'))}</div><dl class="hist">${GUIDE_HISTORY.map(h=>`<dt class="num">v${esc(h.v)} <span class="cap">${esc(h.date)}</span></dt><dd>${esc(L(h))}</dd>`).join('')}</dl><button class="btn sec" data-act="changelog">${esc(t('whats_new'))}</button></section>
  </div>`; }
