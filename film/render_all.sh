#!/bin/bash
# Render every shot (or those given as args) with 4 parallel workers; logs to out/logs.
cd "$(dirname "$0")"; mkdir -p out/logs
SHOTS=${@:-$(node -e "console.log(require('./src/shots.json').map(s=>s.id).join(' '))")}
# heavy shots first so the pool drains evenly
printf "%s\n" $SHOTS | xargs -P ${JOBS:-3} -I{} sh -c 'rm -f out/frames/{}/0*.png; node --expose-gc render.js {} > out/logs/{}.log 2>&1 && echo "done {}" || echo "FAIL {}"'
