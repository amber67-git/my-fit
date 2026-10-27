#!/usr/bin/env bash
# Build My Fit from sources:
#   src/figure/{figure,poses,figmap}.js  -> spliced into src/app.html (between the renderer markers)
#   src/app.html                         -> artifact.html (claude.ai artifact) and, with src/head.html + src/tail.html, index.html (GitHub Pages / PWA)
#   build/dataset.js, build/figall.js    -> inputs for tools/joints.js, tools/audit.js, tools/review.html, tools/zoom4.html
#   build/test.html                      -> Playwright harness used by tests/suites/*.js
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
cat src/figure/figure.js src/figure/poses.js src/figure/figmap.js > build/figall.js
node --check build/figall.js
python3 -I - <<'PY'
import re
app=open('src/app.html',encoding='utf8').read()
fig=open('build/figall.js',encoding='utf8').read()
a=app.index('// ---------- Pose figure renderer'); b=app.index('const ICON_DEFS={}; const ICON_IDS=[];')
app=app[:a]+'// ---------- Pose figure renderer\n'+fig+'\n'+app[b:]
open('src/app.html','w',encoding='utf8').write(app)
# dataset.js: exercise definitions only (plain objects), for the figure tools
i=app.index('const MUSCLE_META='); j=app.index('\n];}',app.index('function DEFAULT_EXERCISES'))+4
d=app[i:j]
d=re.sub(r"function X\(id,en,ko,icon,type,muscle,equip,sets,reps,weight,rest,steps\)\{.*?\n","function X(id,en,ko,icon,type,muscle,equip,sets,reps,weight,rest,steps){return {id,builtin:true,nameEn:en,nameKo:ko,icon,type,muscle,equip,mode:'sets',sets,reps,weight,rest,minutes:Math.max(1,Math.round(sets*(reps*3+rest)/60)),steps:stepsOf(steps)}}\n",d,count=1)
d=re.sub(r"function T\(id,en,ko,icon,type,muscle,equip,minutes,steps\)\{.*?\n","function T(id,en,ko,icon,type,muscle,equip,minutes,steps){return {id,builtin:true,nameEn:en,nameKo:ko,icon,type,muscle,equip,mode:'time',sets:1,reps:1,weight:0,rest:0,minutes,steps:stepsOf(steps)}}\n",d,count=1)
open('build/dataset.js','w',encoding='utf8').write(d)
# test harness: expose internals on window.__T
h=app.replace("\n})();\n","\nwindow.__T={S,P,persist,render,planOf,addPlanItem,openItemEditor,applySmart,startQueue,todayKey,logOf,packExercises,unpackExercises,rptBuild,rptText,rptCsv};\n})();\n",1)
assert 'window.__T' in h, 'harness hook not inserted'
open('build/test.html','w',encoding='utf8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'+h)
PY
cp src/app.html artifact.html
{ cat src/head.html; tail -n +2 src/app.html; cat src/tail.html; } > index.html
# syntax check every inline script block of index.html
rm -f build/app-*.js
awk '/^<script>$/{n++;f=1;next} /^<\/script>$/{f=0;next} f{print > ("build/app-" n ".js")}' index.html
for f in build/app-*.js; do node --check "$f"; done
ver=$(grep -o "APP_VERSION='[^']*'" src/app.html | head -1 | cut -d"'" -f2)
sw=$(grep -o "const VERSION = '[^']*'" sw.js | cut -d"'" -f2)
echo "built index.html + artifact.html (APP_VERSION $ver, sw.js $sw)"
[ "v$ver" = "$sw" ] || { echo "WARNING: sw.js VERSION ($sw) != APP_VERSION ($ver)"; exit 2; }
