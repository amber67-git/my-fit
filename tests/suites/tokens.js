// Design tokens (v0.40.1): colours, common radii, type sizes, weights and gaps in the stylesheet come from the
// custom properties in :root (docs/design-tokens.md). Static check of src/app.html; no browser needed.
const path = require('path'); const fs = require('fs');
const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'app.html'), 'utf8');
const errors = []; const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? ' — ' + info : '')); if (!ok) errors.push(name); };
const s = src.indexOf('<style>'), e = src.indexOf('</style>', s);
const css = src.slice(s, e);
const rootEnd = css.indexOf('}', css.indexOf(':root[data-theme="dark"]{')) + 1;
const tokens = css.slice(0, rootEnd), rules = css.slice(rootEnd);
const defined = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
// 1. no raw colours outside the token blocks
const raw = [...rules.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)].map(m => m[0]);
check('no raw colours in the rules (use var(--…))', raw.length === 0, raw.slice(0, 8).join(' '));
// 2. common scale values go through tokens
const lit = (re) => [...rules.matchAll(re)].map(m => m[0]);
const r = lit(/border-radius:(8|10|12|14|999)px(?=[;}])/g);
check('radii 8/10/12/14/999 px use --r-sm/--r-md/--r/--r-lg/--r-pill', r.length === 0, r.slice(0, 6).join(' '));
const f = lit(/font-size:(10|11|12|13|14|15|16|17|18|20|22)px(?=[;}])/g);
check('font sizes on the type scale use --fs-*', f.length === 0, f.slice(0, 6).join(' '));
const w = lit(/font-weight:(400|600|700)(?=[;}])/g);
check('font weights use --fw-*', w.length === 0, w.slice(0, 6).join(' '));
const g = lit(/(?<![-\w])gap:(4|6|8|12|16)px(?=[ ;}])/g);
check('gaps of 4/6/8/12/16 px use --sp-*', g.length === 0, g.slice(0, 6).join(' '));
// 3. every var(--x) used anywhere in the page is defined (or set at runtime / given a fallback)
const runtime = new Set(['--bm-gap', '--nav-w', '--nav-h']);
const used = [...src.matchAll(/var\((--[\w-]+)(,)?/g)].filter(m => !m[2]).map(m => m[1]);
const undef = [...new Set(used.filter(v => !defined.has(v) && !runtime.has(v) && !new RegExp(v + '\\s*:').test(src)))];
check('every var(--…) without a fallback is defined', undef.length === 0, undef.join(' '));
// 4. both dark blocks define the same tokens
const darkA = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf(':root[data-theme="dark"]{'));
const darkB = css.slice(css.indexOf(':root[data-theme="dark"]{'), rootEnd);
const names = x => [...x.matchAll(/(--[\w-]+)\s*:([^;]+);/g)].map(m => m[1] + ':' + m[2].trim()).sort().join('|');
check('the system-dark and chosen-dark blocks set the same values', names(darkA) === names(darkB));
console.log('errors', JSON.stringify(errors)); process.exit(errors.length ? 1 : 0);
