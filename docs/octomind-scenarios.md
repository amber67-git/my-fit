# Octomind 시나리오 목록 (My Fit)

Octomind에서 test target을 만든 뒤, 아래 문장을 그대로 "Create test case"의 프롬프트로 넣으면 AI가 테스트를 생성합니다.
대상 URL: https://amber67-git.github.io/my-fit/
로그인 화면이 먼저 뜨면 "Use without account (this device only)"를 누르는 전제 스텝을 모든 테스트에 넣어 주세요.

## 기본 흐름
1. **로컬 모드 진입**: 로그인 화면에서 "Use without account" 클릭 → Dashboard 탭이 보인다. 하단 탭 4개(Dashboard, Weekly, Monthly, Settings)가 보인다.
2. **언어 전환**: 상단 EN | KO 스위치로 KO 선택 → 제목이 "대시보드"로 바뀌고 하단 탭 이름도 한국어가 된다. 새로고침 후에도 KO가 유지된다.
3. **오늘 운동 추가 (대시보드)**: "+ Add exercise" 클릭 → 선택창에서 "leg press" 검색 → "Leg press" 클릭 → 오늘 목록에 "Leg press" 카드가 생기고 "Start today's workout" 버튼이 나타난다.
4. **운동 시작·세트 완료**: "Start today's workout" → 준비 화면에 운동 이름, 그림, Target 타일, Step 1·2·3 카드가 보인다 → "Start" → 세트 카드의 체크를 3개 모두 누름 → "Done" → 대시보드로 돌아오고 카드에 초록 체크가 있다. "+ Add exercise" 버튼은 여전히 보인다.
5. **타겟 즉시 수정**: 준비 화면에서 Target 타일(✎) 클릭 → 편집창에서 무게·횟수 변경 후 저장 → 준비 화면 Target 값이 바로 바뀐다.
6. **스와이프 삭제·취소**: 대시보드 카드를 왼쪽으로 스와이프 → 회색 Cancel과 빨간 Delete 버튼이 보인다 → Cancel → 카드가 원위치. 다시 스와이프 → Delete → 카드가 사라진다.
7. **주간 계획**: Weekly 탭 → 요일 선택 → 운동 추가 → 같은 요일에 카드 생김 → 다른 주로 이동 후 돌아와도 유지된다.
8. **루틴 적용**: Weekly → "Apply routine" → "Push / Pull / Legs" 선택 → 이번 주에 적용 → 월/수/금에 카드가 생긴다.
9. **스마트 모드**: Settings → Smart 켜기 → Weekly에서 "Generate this week" → 주 3일 계획이 채워진다.
10. **월간 보기**: Monthly 탭 → 완료한 날짜에 표시가 있고, 날짜 클릭 시 상세가 열린다.
11. **라이브러리 필터**: 선택창에서 부위 "Legs" + 도구 "Machine" 선택 → 목록이 줄어들고 모든 항목에 Machine 표기. "Sports & outdoor" 선택 → Hiking, Tennis 등이 보인다.
12. **검색 (한국어)**: KO 상태에서 선택창 검색에 "레그" 입력 → 레그 프레스·레그 컬·레그 익스텐션이 보인다.
13. **단위 전환**: Settings → kg→lb 전환 → 토스트 "All weights converted", 기존 운동 무게가 lb로 바뀐다. 다시 kg로 돌리면 원래 값.
14. **데이터 내보내기/초기화**: Settings → Export(.json) 버튼 존재. Reset → 확인창 → 데이터가 비고 대시보드가 "Rest day" 상태.
15. **PWA 설치 안내**: Settings에 "Add to home screen" 행이 있고, 클릭 시 iOS 안내 또는 설치 프롬프트가 뜬다.
16. **업데이트 시트**: 새 버전 배포 후 첫 진입에서 "What's new" 시트가 한 번만 뜨고 닫으면 다시 뜨지 않는다.

## 회귀 체크(실패하면 안 되는 것)
- 어떤 화면에서도 가로 스크롤이 생기지 않는다(390px 폭).
- 콘솔에 Uncaught 오류가 없다.
- 운동 카드 클릭 시 반응이 있다(오늘 계획이면 준비 화면, 아니면 편집창).
- 하단 고정 CTA가 마지막 카드를 가리지 않는다.
