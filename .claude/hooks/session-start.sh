#!/bin/bash
# 세션이 시작될 때마다 실행된다.
# 출력한 내용은 클로드의 대화 맥락에 그대로 들어간다.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# 나중에 코드가 생기면 의존성을 설치한다. 지금은 package.json 이 없어 건너뛴다.
if [ -f package.json ]; then
  npm install --no-audit --no-fund >/dev/null 2>&1 \
    || echo "[주의] npm install 실패. 의존성을 직접 확인할 것."
fi

[ -f docs/plan.md ] || exit 0

echo "=== 토킹 튜터 · 세션 시작 브리핑 (자동) ==="
echo
echo "행동 지침은 CLAUDE.md 에 있다. 아래는 docs/plan.md 에서 방금 읽어온 현재 상태다."
echo

sed -n '/<!-- STATUS:START -->/,/<!-- STATUS:END -->/p' docs/plan.md \
  | grep -v 'STATUS:START\|STATUS:END'

echo
echo "--- 지금 차례인 Day ---"
echo

awk '
  BEGIN { RS = "\n### " }
  NR > 1 && /- \[ \]/ {
    n = split($0, L, "\n")
    print "### " L[1]
    for (i = 2; i <= n; i++) {
      if (L[i] ~ /^---/ || L[i] ~ /^## /) break
      print L[i]
    }
    exit
  }
' docs/plan.md

if [ -d docs/history ] && ls docs/history/[0-9]*.md >/dev/null 2>&1; then
  echo
  echo "--- 지난 개발일지 ---"
  for f in docs/history/[0-9]*.md; do
    echo "  $f — $(head -n 1 "$f" | sed 's/^# *//')"
  done
fi

echo
echo "사용자가 '오늘의 할 일'을 물으면 /today 를 쓰거나 위 내용을 정리해 답한다."
echo "=== 브리핑 끝 ==="
