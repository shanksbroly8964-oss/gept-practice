const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const createServer = require('./server');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8888;
const BASE = `http://localhost:${PORT}`;
const EVIDENCE = path.join(ROOT, 'evidence');

const REPORT = [];
let p = 0, f = 0;

function r(test, ok, detail) {
  const s = ok ? 'PASS' : 'FAIL';
  REPORT.push({ test, status: s, detail });
  if (ok) p++; else f++;
  console.log(`  [${s}] ${test}${detail ? ' — ' + detail : ''}`);
}

async function screenshot(page, name) {
  const fp = path.join(EVIDENCE, name);
  await page.screenshot({ path: fp, fullPage: true });
  console.log(`  📷 ${name}`);
  return fp;
}

async function run() {
  console.log('=== GEPT Bug-Fix Verification Suite ===\n');

  const server = await createServer(ROOT, PORT);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    // ── Context with CACHE DISABLED ──
    const context = await browser.newContext({
      bypassCSP: true,
      extraHTTPHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') console.log('    [CONSOLE]', msg.text());
    });

    // ── Mock TTS to capture rate ──
    await page.addInitScript(() => {
      window._ttsCalled = 0;
      window._ttsRates = [];
      window._ttsLastRate = null;

      const FakeUtterance = function(text) {
        this.text = text || '';
        this.lang = 'en-US';
        this.rate = 1.0;
        this.pitch = 1.0;
        this.volume = 1.0;
        this.onend = null;
        this.onerror = null;
      };

      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: FakeUtterance, writable: true, configurable: true
      });

      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          speak(u) {
            window._ttsCalled++;
            window._ttsRates.push(u.rate);
            window._ttsLastRate = u.rate;
            if (u.onend) setTimeout(() => u.onend(), 10);
          },
          cancel() {},
          getVoices() { return []; },
          paused: false, pending: false, speaking: false
        },
        writable: true, configurable: true
      });

      navigator.mediaDevices = {
        getUserMedia() {
          return Promise.resolve({ getTracks() { return [{ stop() {} }]; } });
        }
      };

      window.MediaRecorder = function() {
        this.state = 'inactive';
        this.start = function(ms) {
          this.state = 'recording';
          if (this.ondataavailable) this.ondataavailable({ data: new Blob(['x']), size: 1 });
          setTimeout(() => { this.state = 'inactive'; if (this.onstop) this.onstop(); }, 100);
        };
        this.stop = function() { this.state = 'inactive'; if (this.onstop) this.onstop(); };
      };
      MediaRecorder.isTypeSupported = () => true;

      window.GeptAuth = window.GeptAuth || {};
    });

    // ── Full page load with cache busting ──
    const loadUrl = BASE + '?_=' + Date.now();
    await page.goto(loadUrl, { waitUntil: 'networkidle', timeout: 20000 });
    console.log('  Page loaded');

    // Verify APP_VERSION is set
    const appVer = await page.evaluate(() => window.APP_VERSION);
    r('CACHE: APP_VERSION set', !!appVer, 'version=' + appVer);

    // Select G1
    await page.click('.grade-btn[data-grade="G1"]');
    await page.waitForSelector('#section-nav:not(.hidden)', { timeout: 8000 });
    r('INIT: G1 selected, nav visible', true);

    // ============================================================
    // BUG 1: 選項重複代碼 (Double options prefix)
    // ============================================================
    console.log('\n--- Bug 1: 選項重複代碼 ---');

    // Click "聽力測驗"
    await page.click('.nav-btn[data-section="listening"]');
    await page.waitForTimeout(800);

    // Click "看圖辨義" (first subtype)
    const lSubBtns = await page.$$('#listening-container .subtype-btn');
    r('BUG1: Listening subtype buttons present', lSubBtns.length >= 1);

    if (lSubBtns.length >= 1) {
      await lSubBtns[0].click();
      await page.waitForTimeout(1500);

      // Check for double prefix in option buttons
      const optTexts = await page.$$eval('.option-btn', els => els.map(e => e.textContent.trim())).catch(() => []);
      console.log('    Options found:', optTexts.length, '| Samples:', optTexts.slice(0, 4).join(' | '));

      const doublePattern = /^([A-D])[.。、]\s*\1[.。、]/;
      const hasDouble = optTexts.some(t => doublePattern.test(t));
      const doubleOpts = optTexts.filter(t => doublePattern.test(t));

      r('BUG1: No "A. A. " double prefix in options',
        !hasDouble,
        hasDouble ? 'DOUBLE FOUND: ' + doubleOpts.join(' | ') : 'OK');

      await screenshot(page, 'listening_options.png');
    }

    // ============================================================
    // BUG 2a: 口說測驗 → 朗讀 (no "題庫準備中")
    // ============================================================
    console.log('\n--- Bug 2a: 口說測驗 → 朗讀 ---');

    await page.click('.nav-btn[data-section="speaking"]');
    await page.waitForTimeout(800);

    const sSubBtns = await page.$$('#speaking-container .subtype-btn');
    r('BUG2a: Speaking subtype buttons present', sSubBtns.length >= 2);

    // Click "朗讀" (first button)
    if (sSubBtns.length >= 1) {
      await sSubBtns[0].click();
      await page.waitForTimeout(2000);

      const bodyText = await page.evaluate(() => document.body.textContent || '');
      const hasPrepare = bodyText.includes('題庫準備中');
      const hasSpeakingText = await page.$('.speaking-text');
      const hasDemo = await page.$('#speaking-demo-btn');

      r(`BUG2a: No "題庫準備中" in 朗讀`, !hasPrepare);
      r(`BUG2a: Has speaking content (.speaking-text or demo-btn)`, !!(hasSpeakingText || hasDemo));

      if (hasPrepare) {
        console.log('    UNEXPECTED body excerpt:', bodyText.substring(0, 300));
      }

      await screenshot(page, 'speaking_readaloud.png');
    }

    // ============================================================
    // BUG 2b: 寫作測驗 → 看圖段落寫作 (no "題庫準備中")
    // ============================================================
    console.log('\n--- Bug 2b: 寫作測驗 → 看圖段落寫作 ---');

    await page.click('.nav-btn[data-section="writing"]');
    await page.waitForTimeout(800);

    const wSubBtns = await page.$$('#writing-container .subtype-btn');
    r('BUG2b: Writing subtype buttons present', wSubBtns.length >= 2);

    // Click "看圖段落寫作" (second button)
    if (wSubBtns.length >= 2) {
      await wSubBtns[1].click();
      await page.waitForTimeout(2000);

      const wBodyText = await page.evaluate(() => document.body.textContent || '');
      const wHasPrepare = wBodyText.includes('題庫準備中');
      const hasTextarea = await page.$('#writing-answer');
      const hasWC = await page.$('#word-count');

      r(`BUG2b: No "題庫準備中" in 看圖段落寫作`, !wHasPrepare);
      r(`BUG2b: Has textarea + wordcount`, !!(hasTextarea && hasWC));

      if (wHasPrepare) {
        console.log('    UNEXPECTED body excerpt:', wBodyText.substring(0, 300));
      }

      await screenshot(page, 'writing_paragraph.png');
    }

    // ============================================================
    // BUG 3: TTS 太快 (rate <= 0.5)
    // ============================================================
    console.log('\n--- Bug 3: TTS rate check ---');

    // Test listening TTS rate
    await page.click('.nav-btn[data-section="listening"]');
    await page.waitForTimeout(800);
    const lSubBtns2 = await page.$$('#listening-container .subtype-btn');
    if (lSubBtns2.length >= 1) {
      await lSubBtns2[0].click();
      await page.waitForTimeout(1500);

      const playBtn = await page.$('#play-btn');
      if (playBtn) {
        await page.evaluate(() => { window._ttsCalled = 0; window._ttsRates = []; window._ttsLastRate = null; });
        await playBtn.click();
        await page.waitForTimeout(500);

        const ttsCalled = await page.evaluate(() => window._ttsCalled > 0);
        const ttsRates = await page.evaluate(() => window._ttsRates);
        const ttsLastRate = await page.evaluate(() => window._ttsLastRate);

        r('BUG3-listening: TTS called', ttsCalled);
        const allOk = ttsRates.length > 0 && ttsRates.every(rate => rate <= 0.5);
        r('BUG3-listening: All TTS rates <= 0.5', allOk,
          'rates=' + JSON.stringify(ttsRates) + ' lastRate=' + ttsLastRate);
      } else {
        r('BUG3-listening: TTS button exists', false, 'no play-btn found');
      }
    }

    // Test speaking readaloud TTS rate
    await page.click('.nav-btn[data-section="speaking"]');
    await page.waitForTimeout(800);
    const sSubBtns2 = await page.$$('#speaking-container .subtype-btn');
    if (sSubBtns2.length >= 1) {
      await sSubBtns2[0].click();
      await page.waitForTimeout(1500);

      const demoBtn = await page.$('#speaking-demo-btn');
      if (demoBtn) {
        await page.evaluate(() => { window._ttsCalled = 0; window._ttsRates = []; window._ttsLastRate = null; });
        await demoBtn.click();
        await page.waitForTimeout(300);

        const ttsCalled2 = await page.evaluate(() => window._ttsCalled > 0);
        const ttsLastRate2 = await page.evaluate(() => window._ttsLastRate);

        r('BUG3-speaking: TTS called for demo', ttsCalled2);
        r('BUG3-speaking: TTS rate <= 0.5', ttsLastRate2 !== null && ttsLastRate2 <= 0.5,
          'rate=' + ttsLastRate2);
      } else {
        r('BUG3-speaking: Demo button exists', false, 'no demo-btn');
      }
    }

    // ============================================================
    // QUICK REGRESSION
    // ============================================================
    console.log('\n--- Quick Regression ---');

    // G3 listening check
    await page.selectOption('#grade-select', 'G3');
    await page.waitForTimeout(600);
    await page.click('.nav-btn[data-section="listening"]');
    await page.waitForTimeout(800);
    const lSubBtns3 = await page.$$('#listening-container .subtype-btn');
    if (lSubBtns3.length >= 1) {
      await lSubBtns3[0].click();
      await page.waitForTimeout(1500);
      const l3hasPrepare = await page.evaluate(() =>
        (document.body.textContent || '').includes('題庫準備中'));
      r('REG-G3-listening: No 題庫準備中', !l3hasPrepare);
    }

    // Mock exam
    await page.selectOption('#grade-select', 'G1');
    await page.waitForTimeout(600);
    await page.click('.nav-btn[data-section="mockexam"]');
    await page.waitForTimeout(3000);
    const startBtn = await page.$('#mockexam-start-btn');
    r('REG-mockexam: Start button visible', !!startBtn);

    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(2000);
      const timer = await page.$('#mockexam-timer-text');
      r('REG-mockexam: Timer appears', !!timer);
    }

    // Progress dashboard
    await page.click('.nav-btn[data-section="progress"]');
    await page.waitForTimeout(2000);
    const dashboard = await page.$('.progress-dashboard');
    r('REG-progress: Dashboard visible', !!dashboard);

    // MCQ answer flow
    await page.click('.nav-btn[data-section="vocab"]');
    await page.waitForTimeout(1000);
    const optBtns = await page.$$('#options-container .option-btn');
    r('REG-vocab: Options render', optBtns.length > 0);
    if (optBtns.length > 0) {
      await optBtns[0].click();
      await page.waitForTimeout(300);
      const fb = await page.$eval('#feedback', el => el.className).catch(() => '');
      r('REG-vocab: Answer feedback shown', !fb.includes('hidden'));
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    await screenshot(page, 'final_state.png');

    await page.close();
    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (e) {
    console.error('FATAL ERROR:', e.message);
    console.error(e.stack);
    f++;
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Results: ${p} PASS / ${f} FAIL / ${p+f} TOTAL`);
  console.log(`${'='.repeat(60)}`);
  REPORT.forEach(r => {
    console.log(`  ${r.status === 'PASS' ? '✓' : '✗'} [${r.status}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`);
  });

  // Write report markdown
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const bug1tests = REPORT.filter(r => r.test.startsWith('BUG1'));
  const bug2atests = REPORT.filter(r => r.test.startsWith('BUG2a'));
  const bug2btests = REPORT.filter(r => r.test.startsWith('BUG2b'));
  const bug3tests = REPORT.filter(r => r.test.startsWith('BUG3'));
  const regtests = REPORT.filter(r => r.test.startsWith('REG'));
  const cachetests = REPORT.filter(r => r.test.startsWith('CACHE'));

  const ttsRates = REPORT.find(r => r.test === 'BUG3-listening: All TTS rates <= 0.5');

  const md = [
    '# VERIFY_REPORT.md',
    '',
    '## Cache-Busting Verification Report',
    '',
    `- **Date**: ${now}`,
    `- **APP_VERSION**: 20260701-2`,
    `- **Passed**: ${p}, **Failed**: ${f}, **Total**: ${p+f}`,
    '',
    '---',
    '',
    '## Cache-Busting Changes',
    '',
    '| File | Change |',
    '|------|--------|',
    '| `index.html` | Added `window.APP_VERSION=\'20260701-2\'` script at top. Added `?v=20260701-2` to all CSS `<link>` and all JS `<script>` tags (13 total). |',
    '| `js/data-loader.js` | Modified `fetch(url)` to `fetch(url + \'?v=\' + window.APP_VERSION)` for JSON data cache-busting. |',
    '| `firebase.json` | Added `headers` section: all `*.html` files get `Cache-Control: no-cache`. Also added `VERIFY_REPORT.md` and `evidence/**` to ignore list. |',
    '',
    '---',
    '',
    '## Bug 1: 選項重複代碼 (Double Options Prefix)',
    '',
    '**Assertion**: No option button text matches regex `/^([A-D])[.。、]\\s*\\1[.。、]/` (e.g., "A. A. some text").',
    '',
    '| Test | Result | Detail | Screenshot |',
    '|------|--------|--------|------------|',
    ...bug1tests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} | ${t.test.startsWith('BUG1: No') ? 'listening_options.png' : '-'} |`),
    '',
    '---',
    '',
    '## Bug 2a: 口說測驗 → 朗讀 (No "題庫準備中")',
    '',
    '**Assertion**: 畫面不出現「題庫準備中」，且有實際朗讀內容 (.speaking-text 或 demo 按鈕)。',
    '',
    '| Test | Result | Detail | Screenshot |',
    '|------|--------|--------|------------|',
    ...bug2atests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} | ${t.test.includes('No') ? 'speaking_readaloud.png' : '-'} |`),
    '',
    '---',
    '',
    '## Bug 2b: 寫作測驗 → 看圖段落寫作 (No "題庫準備中")',
    '',
    '**Assertion**: 畫面不出現「題庫準備中」，且有 textarea 與 word-count。',
    '',
    '| Test | Result | Detail | Screenshot |',
    '|------|--------|--------|------------|',
    ...bug2btests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} | ${t.test.includes('No') ? 'writing_paragraph.png' : '-'} |`),
    '',
    '---',
    '',
    '## Bug 3: TTS 太快 (Rate <= 0.5)',
    '',
    '**Assertion**: `speechSynthesis.speak()` 被呼叫時 `utterance.rate <= 0.5`。',
    '',
    '| Test | Result | Detail | Screenshot |',
    '|------|--------|--------|------------|',
    ...bug3tests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} | - |`),
    '',
    '---',
    '',
    '## Regression Tests',
    '',
    '| Test | Result | Detail |',
    '|------|--------|--------|',
    ...regtests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} |`),
    '',
    '---',
    '',
    '## Cache-Busting Test',
    '',
    '| Test | Result | Detail |',
    '|------|--------|--------|',
    ...cachetests.map(t => `| ${t.test} | **${t.status}** | ${t.detail || '-'} |`),
    '',
    '---',
    '',
    '## Final State Screenshot',
    '',
    '![Final State](evidence/final_state.png)',
    '',
    '---',
    '',
    f === 0
      ? '## Conclusion\n\nAll tests passed. The 3 previously reported bugs are verified fixed.'
      : `## Issues Found\n\n${f} test(s) failed. Review details above.`,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(ROOT, 'VERIFY_REPORT.md'), md);
  console.log('\nReport written to VERIFY_REPORT.md');

  process.exit(f > 0 ? 1 : 0);
}

run();
