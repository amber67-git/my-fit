#!/usr/bin/env bash
# Build, then run the Playwright suites in tests/suites against build/test.html.
# Env: PW_MODULE (playwright module path), PW_CHROMIUM (chromium executable), both optional.
set -uo pipefail
cd "$(dirname "$0")/.."
tools/build.sh >/dev/null || exit 1
mkdir -p build/shots
fail=0
for f in tests/suites/*.js; do
  name=$(basename "$f" .js)
  out=$(cd build/shots && timeout 300 node "../../$f" 2>&1); code=$?
  if [ $code -ne 0 ] || ! grep -q 'errors \[\]' <<<"$out"; then
    echo "FAIL $name (exit $code)"; echo "$out" | grep -v "agent-proxy\|gstatic\|For details\|connect_rejected" | tail -15; fail=1
  else
    echo "ok   $name"
  fi
done
exit $fail
