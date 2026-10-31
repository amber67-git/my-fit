# 다른 프로젝트에서 같은 "CodeRabbit 리뷰 → 반영 → 자동 머지" 흐름 쓰기

CodeRabbit은 GitHub App이라 **프롬프트를 채팅으로 전달하는 게 아니라, 저장소 안의 설정 파일**로 지시합니다.
두 파일만 복사하면 됩니다.

## 1. 저장소에 CodeRabbit 연결 (한 번만, 본인이)
1. https://coderabbit.ai → GitHub으로 로그인 → 해당 저장소 추가(또는 조직 전체 허용).
2. 그 다음부터 PR마다 자동 리뷰가 달립니다. **PR 단위**로만 동작하므로 main 직접 푸시에는 안 붙습니다.

## 2. `.coderabbit.yaml` = CodeRabbit에게 주는 프롬프트
저장소 루트에 두세요. 아래 템플릿에서 `path_instructions`의 경로와 문장만 그 프로젝트에 맞게 바꾸면 됩니다.
`tone_instructions`가 전체 어조, `path_instructions`가 파일별 "무엇을 중점적으로 볼지"입니다.

```yaml
language: "ko-KR"
tone_instructions: "간결하고 구체적으로. 실제로 깨지는 경우(입력, 상태, 결과)를 한 문장으로 설명하고, 고치는 방법을 제안한다. 칭찬은 생략."
reviews:
  profile: "assertive"          # 더 많이 지적. 조용히 하려면 "chill"
  request_changes_workflow: false
  high_level_summary: true
  poem: false
  auto_review:
    enabled: true
    drafts: false
    base_branches: ["main"]
  path_filters:
    - "!dist/**"                # 빌드 산출물·바이너리는 제외
    - "!**/*.min.js"
  path_instructions:
    - path: "src/**"
      instructions: |
        이 프로젝트의 핵심 규칙을 여기에 적는다. 예:
        - 저장/네트워크 실패가 조용히 삼켜지는지
        - 날짜·시간대·자정 경계 계산
        - 사용자 입력이 HTML/CSV/SQL로 그대로 들어가는지
        - i18n 키가 모든 언어 테이블에 있는지
    - path: ".github/workflows/**"
      instructions: "비밀값이 로그에 노출되지 않는지, 비밀값이 없을 때 실패 대신 건너뛰는지 확인."
chat:
  auto_reply: true
```

## 3. `CLAUDE.md` = Claude에게 주는 작업 규칙 (리뷰 반영·자동 머지 루프)
프로젝트 루트의 `CLAUDE.md`에 아래를 넣으면, 그 프로젝트의 Claude Code 세션이 같은 흐름으로 일합니다.
`OWNER/REPO`만 바꾸세요.

```markdown
## 배포 흐름: 브랜치 → PR → CodeRabbit 반영 → 자동 머지
1. 작업은 feat/… fix/… chore/… 브랜치에서. main에 직접 푸시하지 않는다.
2. 푸시 후 PR을 연다: gh pr create --base main --head "$BRANCH" --title "..." --body "..."
   (GraphQL이 막힌 환경이면 REST: gh api -X POST repos/OWNER/REPO/pulls -f title="..." -f head="$BRANCH" -f base=main -f body="...").
   본문에 바뀐 것, 검증한 것, 사용자에게 알릴 한계를 적는다.
3. CodeRabbit 리뷰를 기다린다. 세 곳을 모두 본다(코드 줄 댓글, 리뷰 본문, PR 전체 댓글):
   gh api --paginate repos/OWNER/REPO/pulls/N/comments
   gh api --paginate repos/OWNER/REPO/pulls/N/reviews
   gh api --paginate repos/OWNER/REPO/issues/N/comments
   coderabbitai[bot]의 "Actionable comments posted" 리뷰가 올 때까지 최대 10분(30초 간격) 폴링.
   10분 안에 안 오면 "리뷰 없음"으로 기록하고 진행한다.
4. 댓글은 전부 읽고 판단한다. 실제 버그·회귀는 고쳐서 같은 브랜치에 커밋·푸시(다시 리뷰 대기),
   오탐·의도된 동작은 PR 댓글로 이유를 남긴다. 댓글마다 "반영했습니다 (commit …)" 답글을 단다.
5. 테스트 통과 + 반영 완료면 스쿼시 머지하고 브랜치를 지운다: gh pr merge N --squash --delete-branch
   (REST: gh api -X PUT repos/OWNER/REPO/pulls/N/merge -f merge_method=squash 다음에 git push origin --delete "$BRANCH").
6. 머지 후 CI/배포 성공을 확인한다.
7. 사용자에게 한국어로 보고: 무엇이 바뀌었는지, 리뷰 댓글 수와 처리 결과, 배포 결과, 권한·네트워크 한계.
```

## 4. 시작할 때 Claude에게 보낼 한 줄
> "이 프로젝트도 my-fit처럼 CodeRabbit 리뷰 받고 반영한 뒤 자동 머지하는 흐름으로 해줘. `.coderabbit.yaml`이랑 `CLAUDE.md`를 docs/reuse-in-other-projects.md 템플릿 기준으로 만들어서 첫 PR부터 적용해."

## 5. 함께 쓰면 좋은 것
- 리뷰가 잡기 어려운 "실제 사용 흐름"은 Playwright 시뮬레이션(`tests/persona*.cjs` 참고)으로 보완.
- CI에서 PR마다 테스트를 돌리면 CodeRabbit이 "Pipeline failures"를 근거로 더 정확한 지적을 합니다.
