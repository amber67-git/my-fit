# My Fit — 작업 규칙 (Claude용)

## 배포 흐름: 브랜치 → PR → 리뷰 반영 → 자동 머지
사용자(amber6.an)가 정한 흐름입니다. main에 직접 푸시하지 않습니다.

1. 작업은 `feat/…`, `fix/…`, `chore/…` 브랜치에서 한다. 커밋 메시지는 영어, 끝에 지정된 Co-Authored-By / Claude-Session 트레일러.
2. 푸시 후 REST로 PR을 연다: `gh api -X POST repos/amber67-git/my-fit/pulls -f title=… -f head=<branch> -f base=main -f body=…` (`gh pr create`는 GraphQL이라 이 세션에서 막힘). 본문에는 바뀐 것, 검증한 것(테스트 스위트, 그림 렌더 확인), 사용자에게 알릴 한계를 적는다.
3. CodeRabbit 리뷰를 기다린다: `gh api repos/amber67-git/my-fit/pulls/N/comments`와 `/reviews`에서 `coderabbitai[bot]`의 댓글을 최대 10분(30초 간격) 폴링. 연결 전이거나 10분 안에 안 오면 "리뷰 없음"으로 기록하고 진행한다.
4. 리뷰 댓글은 전부 읽고 판단한다. 실제 버그·회귀는 고쳐서 같은 브랜치에 커밋·푸시하고(다시 리뷰 대기), 오탐이나 의도된 동작은 PR 댓글로 이유를 남긴다.
5. 테스트가 통과하고 반영이 끝나면 REST로 스쿼시 머지한다: `gh api -X PUT repos/amber67-git/my-fit/pulls/N/merge -f merge_method=squash`. 브랜치는 삭제한다. GraphQL은 이 세션에서 막혀 있으니 `gh pr merge`는 쓰지 않는다.
6. 머지 후 `gh run watch`로 Pages 배포 성공을 확인하고, Octomind 워크플로 결과(설정 전이면 skipped)를 확인한다. 아티팩트(https://claude.ai/artifact/CJtK7LTZNTx4DQJtFMWL9j)도 같은 버전으로 갱신한다.
7. 사용자에게는 한국어로: 무엇이 바뀌었는지, 리뷰 댓글이 몇 개였고 어떻게 처리했는지, 배포 결과, 권한·네트워크 한계를 보고한다.

## 검증 최소선 (머지 전)
- `node --check`로 index.html의 스크립트 문법 확인.
- 스크래치패드의 run10/run11/run12/swipe/dash19 Playwright 스위트 통과(시계는 2026-10-19로 고정, `wwt.seenVersion`은 현재 APP_VERSION).
- 그림을 바꿨으면 joints.js(관절 각도)와 audit.js(바닥·겹침) 실행, 바뀐 그림은 렌더해서 직접 본다.
- APP_VERSION, CHANGELOG, sw.js의 VERSION, README의 버전·운동 개수를 함께 올린다.

## 권한·한계
- 이 세션은 외부 사이트 대부분(github.io 포함)에 접속할 수 없다. 라이브 페이지 확인은 워크플로 성공 여부로 대신한다.
- CodeRabbit/Octomind 계정 연결은 사용자만 할 수 있다. 연결 전에는 리뷰·E2E가 비어 있음을 보고한다.
