// File saves inside the claude.ai artifact (v0.41): with the `downloads` capability the CSV, JSON backup and weekly PNG
// go through downloads.save (viewer-confirmed); without it the buttons fall back to Copy; a declined prompt is quiet.
// The artifact runtime is stubbed: window.claude.use() resolves a fake `downloads` namespace (or null).
const path = require('path'); const fs = require('fs');
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const HARNESS = process.env.HARNESS || path.resolve(__dirname, '..', '..', 'build', 'test.html');
const APP_VER = (fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'app.html'), 'utf8').match(/APP_VERSION='([^']+)'/) || [])[1];
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const errors = []; const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? ' — ' + info : '')); if (!ok) errors.push(name); };
  const open = async (mode) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.clock.install({ time: new Date('2026-11-10T10:00:00') }); await page.clock.runFor(1);
    await page.addInitScript(([mode, v]) => {
      if (!localStorage.getItem('wwt.seenVersion')) localStorage.setItem('wwt.seenVersion', v);
      if (mode === 'web') return;
      window.__saved = [];
      const dl = Object.freeze({ save: async (r) => {
        const size = r.data instanceof Blob ? r.data.size : String(r.data).length;
        window.__saved.push({ filename: r.filename, blob: r.data instanceof Blob, size });
        if (mode === 'declined') { const e = new Error('no'); e.code = 'declined'; throw e; }
        if (mode === 'gone') { const e = new Error('x'); e.code = 'unavailable'; throw e; }
        return { status: 'saved' };
      } });
      window.claude = Object.freeze({ use: (n) => (n === 'downloads' && mode !== 'none') ? (mode === 'late' ? new Promise(r => setTimeout(() => r(dl), 8000)) : Promise.resolve(dl)) : Promise.resolve(null) });
    }, [mode, APP_VER]);
    await page.goto('file://' + HARNESS); await page.waitForTimeout(400);
    await page.evaluate(() => { const T = window.__T, S = T.S; S.settings.lang = 'ko'; S.plans = {}; S.logs = {};
      const mk = (k, id, w, r) => { S.logs[k] = S.logs[k] || { entries: [] }; const st = new Date(k + 'T09:00:00').getTime(); S.logs[k].entries.push({ id: 'e' + k + id, planItemId: 'p' + k + id, exId: id, mode: 'sets', startedAt: st, endedAt: st + 600000, duration: 600, sets: [0, 1, 2].map(() => ({ reps: r, weight: w, done: true })), memo: '', condition: 3, rpe: 7 }); };
      mk('2026-10-27', 'ex_bench', 40, 8); mk('2026-11-03', 'ex_bench', 45, 8); mk('2026-11-04', 'ex_bbrow', 30, 10); T.render(); });
    return { ctx, page, errs };
  };
  const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.textContent).join(' | '));
  const clearToasts = (page) => page.evaluate(() => document.querySelectorAll('.toast').forEach(x => x.remove()));

  // 1. artifact with downloads: all three saves go through downloads.save
  let { ctx, page, errs } = await open('ok');
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); });
  check('artifact + downloads: the report offers CSV', await page.locator('[data-act="rpt-csv"]').count() === 1);
  await page.click('[data-act="rpt-csv"]'); await page.waitForTimeout(150);
  let s = await page.evaluate(() => window.__saved.slice(-1)[0]);
  check('CSV goes to downloads.save as a .csv Blob', !!s && /^my-fit-report-\d{4}-\d{2}-\d{2}\.csv$/.test(s.filename) && s.blob && s.size > 50, JSON.stringify(s));
  check('a confirmed save shows 파일을 저장했어요', /파일을 저장했어요/.test(await toasts(page)));
  await clearToasts(page);
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'settings'; T.S.sub = null; T.render(); });
  await page.click('[data-act="export"]'); await page.locator('#dl').waitFor({ timeout: 3000 });
  await page.click('#dl'); await page.waitForTimeout(150);
  s = await page.evaluate(() => window.__saved.slice(-1)[0]);
  check('JSON backup has a download button and saves my-fit-<date>.json', !!s && /^my-fit-\d{4}-\d{2}-\d{2}\.json$/.test(s.filename) && s.size > 200, JSON.stringify(s));
  await page.evaluate(() => { document.querySelector('[data-act="close-sheet"]')?.click(); document.querySelectorAll('.backdrop,#sheet').forEach(x => x.remove()); const T = window.__T; T.S.tab = 'dash'; T.render(); });
  check('the weekly card says 이미지로 저장', /이미지로 저장/.test(await page.evaluate(() => document.querySelector('[data-act="wk-share"]')?.textContent || '')));
  await page.click('[data-act="wk-share"]'); await page.waitForTimeout(250);
  s = await page.evaluate(() => window.__saved.slice(-1)[0]);
  check('the weekly review saves myfit-week-2026-11-02.png as an image Blob', !!s && s.filename === 'myfit-week-2026-11-02.png' && s.blob && s.size > 5000, JSON.stringify(s));
  check('no page errors (downloads available)', errs.length === 0, errs.join(' | '));
  await ctx.close();

  // 2. viewer declines: no error toast, nothing else happens
  ({ ctx, page, errs } = await open('declined'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); });
  await clearToasts(page); await page.click('[data-act="rpt-csv"]'); await page.waitForTimeout(150);
  const t2 = await toasts(page);
  check('a declined save is quiet (no saved or error message) and the button stays', t2 === '' && await page.locator('[data-act="rpt-csv"]').count() === 1, t2);
  await ctx.close();

  // 3. capability withdrawn mid-session: one message, buttons fall back to Copy
  ({ ctx, page, errs } = await open('gone'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); });
  await clearToasts(page); await page.click('[data-act="rpt-csv"]'); await page.waitForTimeout(200);
  check('an unavailable save says so and hides the CSV button', /파일 저장을 쓸 수 없어요/.test(await toasts(page)) && await page.locator('[data-act="rpt-csv"]').count() === 0, await toasts(page));
  await ctx.close();

  // 3b. withdrawn while the JSON sheet is open: its download button goes, Copy stays
  ({ ctx, page, errs } = await open('gone'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'settings'; T.S.sub = null; T.render(); }); await page.click('[data-act="export"]'); await page.locator('#dl').waitFor({ timeout: 3000 });
  await page.click('#dl'); await page.waitForTimeout(200);
  check('a failed save inside the open JSON sheet removes its download button and keeps Copy', await page.locator('#dl').count() === 0 && await page.locator('#cp').count() === 1);
  await ctx.close();

  // 3c. the capability arrives late: only the save controls change, the page is not rebuilt
  ({ ctx, page, errs } = await open('late'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); const v = document.querySelector('[data-act="rpt-text"]'); v.dataset.sentinel = 'kept'; const i = document.createElement('input'); i.id = 'draft'; i.value = 'typed but not saved'; v.parentElement.parentElement.appendChild(i); });
  check('before the capability answers there is no CSV button', await page.locator('[data-act="rpt-csv"]').count() === 0);
  await page.clock.runFor(8100); await page.waitForTimeout(150);
  const late = await page.evaluate(() => ({ csv: document.querySelectorAll('[data-act="rpt-csv"]').length, kept: document.querySelector('[data-act="rpt-text"]')?.dataset.sentinel, draft: document.querySelector('#draft')?.value }));
  check('when it arrives the CSV button appears without rebuilding the page (draft input kept)', late.csv === 1 && late.kept === 'kept' && late.draft === 'typed but not saved', JSON.stringify(late));
  await page.click('[data-act="rpt-csv"]'); await page.waitForTimeout(150);
  check('the late-added CSV button works', /\.csv$/.test((await page.evaluate(() => window.__saved.slice(-1)[0]?.filename)) || ''));
  await ctx.close();
  // 3d. the JSON sheet is already open when the capability arrives: its download button is added and works
  ({ ctx, page, errs } = await open('late'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'settings'; T.S.sub = null; T.render(); }); await page.click('[data-act="export"]'); await page.locator('#cp').waitFor({ timeout: 3000 });
  check('JSON sheet opened before the answer: no download button yet', await page.locator('#dl').count() === 0);
  await page.clock.runFor(8100); await page.waitForTimeout(150);
  check('when the capability arrives the open sheet gains a download button', await page.locator('#dl').count() === 1);
  await page.click('#dl'); await page.waitForTimeout(150);
  check('that button saves my-fit-<date>.json', /^my-fit-\d{4}-\d{2}-\d{2}\.json$/.test((await page.evaluate(() => window.__saved.slice(-1)[0]?.filename)) || ''));
  check('no page errors (late capability)', errs.length === 0, errs.join(' | '));
  await ctx.close();

  // 4. artifact without the capability: Copy instead of files
  ({ ctx, page, errs } = await open('none'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); });
  check('artifact without downloads: no CSV button', await page.locator('[data-act="rpt-csv"]').count() === 0);
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'dash'; T.render(); });
  check('the weekly card offers 복사 instead of an image', /복사/.test(await page.evaluate(() => document.querySelector('[data-act="wk-share"]')?.textContent || '')));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'settings'; T.S.sub = null; T.render(); }); await page.click('[data-act="export"]'); await page.locator('#cp').waitFor({ timeout: 3000 });
  check('the JSON sheet has Copy but no download button', await page.locator('#dl').count() === 0);
  check('no page errors (no capability)', errs.length === 0, errs.join(' | '));
  await ctx.close();

  // 5. the web app keeps ordinary browser downloads
  ({ ctx, page, errs } = await open('web'));
  await page.evaluate(() => { const T = window.__T; T.S.tab = 'report'; T.render(); });
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('[data-act="rpt-csv"]')]);
  check('web app: CSV is a normal browser download', !!d && /\.csv$/.test(d.suggestedFilename()), d && d.suggestedFilename());
  check('web app: no "saved" toast (the browser shows its own)', !/파일을 저장했어요/.test(await toasts(page)));
  await ctx.close();
  console.log('errors', JSON.stringify(errors)); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
