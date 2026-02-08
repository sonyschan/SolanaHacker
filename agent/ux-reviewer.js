/**
 * UX Reviewer — 2-Stage Review System
 *
 * Stage 1: Hard Metrics (Build Check, Runtime Check, Visual Check)
 *   → If ANY fails, score = 0, skip Vision Assessment
 *
 * Stage 2: Vision Assessment (Claude Vision)
 *   → Only runs after Stage 1 passes
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class UXReviewer {
  constructor(anthropicApiKey, screenshotsDir) {
    this.client = new Anthropic({ apiKey: anthropicApiKey });
    this.screenshotsDir = screenshotsDir;
    this.browser = null;
  }

  /**
   * Initialize browser
   */
  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // =========================================
  //  Stage 1: Hard Metrics
  // =========================================

  /**
   * Run all hard metric checks
   * @param {string} workDir - Project directory with package.json
   * @param {string} url - Dev server URL
   * @returns {{passed: boolean, buildOk: boolean, runtimeOk: boolean, visualOk: boolean, errors: string[]}}
   */
  async hardMetrics(workDir, url) {
    const result = {
      passed: false,
      buildOk: false,
      runtimeOk: false,
      visualOk: false,
      errors: [],
    };

    // 1. Build Check
    try {
      await execAsync('npm run build', { cwd: workDir, timeout: 60000 });
      result.buildOk = true;
      console.log('[UX] Build check: PASSED');
    } catch (err) {
      const msg = (err.stderr || err.message || '').slice(0, 500);
      result.errors.push(`Build failed: ${msg}`);
      console.log('[UX] Build check: FAILED');
      return result; // Early exit — no point continuing
    }

    // 2. Runtime Check (console errors via Playwright)
    if (!this.browser) await this.init();
    const page = await this.browser.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Filter for fatal errors (Uncaught, TypeError, ReferenceError)
      const fatalErrors = consoleErrors.filter(e =>
        /uncaught|typeerror|referenceerror|syntaxerror|cannot read|is not defined|is not a function/i.test(e)
      );

      if (fatalErrors.length === 0) {
        result.runtimeOk = true;
        console.log('[UX] Runtime check: PASSED');
      } else {
        result.errors.push(`Runtime errors (${fatalErrors.length}): ${fatalErrors.slice(0, 3).join('; ')}`);
        console.log(`[UX] Runtime check: FAILED (${fatalErrors.length} fatal errors)`);
      }

      // 3. Visual Check (DOM content density)
      const bodyContent = await page.evaluate(() => {
        const body = document.body;
        if (!body) return '';
        // Get visible text + count of meaningful elements
        const text = body.innerText || '';
        const elements = body.querySelectorAll('div, section, main, article, h1, h2, h3, p, button, a, img, canvas, svg');
        return `TEXT:${text.length}|ELEMENTS:${elements.length}`;
      });

      const textMatch = bodyContent.match(/TEXT:(\d+)/);
      const elemMatch = bodyContent.match(/ELEMENTS:(\d+)/);
      const textLength = parseInt(textMatch?.[1] || '0');
      const elementCount = parseInt(elemMatch?.[1] || '0');

      // White screen = less than 50 chars of text AND less than 5 elements
      if (textLength >= 50 || elementCount >= 5) {
        result.visualOk = true;
        console.log(`[UX] Visual check: PASSED (text: ${textLength} chars, elements: ${elementCount})`);
      } else {
        result.errors.push(`White screen detected: ${textLength} chars, ${elementCount} elements`);
        console.log(`[UX] Visual check: FAILED (text: ${textLength}, elements: ${elementCount})`);
      }
    } catch (err) {
      result.errors.push(`Page load failed: ${err.message}`);
      console.log(`[UX] Runtime/Visual check: FAILED (${err.message})`);
    } finally {
      await page.close();
    }

    result.passed = result.buildOk && result.runtimeOk && result.visualOk;
    return result;
  }

  // =========================================
  //  Stage 2: Vision Assessment
  // =========================================

  /**
   * Take screenshot of local dev server
   */
  async takeScreenshot(url, name = 'screenshot') {
    if (!this.browser) await this.init();

    const page = await this.browser.newPage();
    await page.setViewportSize({ width: 896, height: 504 });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const timestamp = Date.now();
      const filename = `${name}-${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      if (!fs.existsSync(this.screenshotsDir)) {
        fs.mkdirSync(this.screenshotsDir, { recursive: true });
      }

      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`[UX] Screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('[UX] Screenshot failed:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Take mobile screenshot
   */
  async takeMobileScreenshot(url, name = 'mobile') {
    if (!this.browser) await this.init();

    const page = await this.browser.newPage();
    await page.setViewportSize({ width: 263, height: 569 });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const timestamp = Date.now();
      const filename = `${name}-${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`[UX] Mobile screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('[UX] Mobile screenshot failed:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Review screenshot with Claude Vision
   */
  async reviewScreenshot(screenshotPath) {
    const imageData = fs.readFileSync(screenshotPath);
    const base64 = imageData.toString('base64');
    const mediaType = 'image/png';

    const prompt = `You are a UX expert reviewing a Solana web application screenshot.

Evaluate the UI on these criteria (score each 0-100):

1. **Visual Hierarchy** (20%): Is the most important content prominent? Is there clear information architecture?

2. **First Impression** (20%): Is the value proposition clear? Would a new user understand what this does?

3. **Usability** (20%): Are interactive elements obvious? Is the layout intuitive?

4. **Web3 UX** (20%): Is wallet connection clear but non-intrusive? Are crypto concepts explained?

5. **Aesthetics** (20%): Is the design polished? Are colors, spacing, and typography consistent?

Respond in this exact JSON format:
{
  "scores": {
    "visualHierarchy": <0-100>,
    "firstImpression": <0-100>,
    "usability": <0-100>,
    "web3UX": <0-100>,
    "aesthetics": <0-100>
  },
  "totalScore": <weighted average>,
  "topIssues": ["issue1", "issue2", "issue3"],
  "improvements": ["suggestion1", "suggestion2", "suggestion3"],
  "summary": "<one sentence summary>"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const text = response.content[0].text;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse UX review response');
    } catch (error) {
      console.error('[UX] Review failed:', error.message);
      return {
        scores: { visualHierarchy: 0, firstImpression: 0, usability: 0, web3UX: 0, aesthetics: 0 },
        totalScore: 0,
        topIssues: ['Vision review failed: ' + error.message],
        improvements: ['Fix the issues above and retry'],
        summary: 'Review failed',
      };
    }
  }

  /**
   * Full 2-stage UX review cycle
   * @param {string} url - Dev server URL
   * @param {string} workDir - Project directory for build check
   */
  async fullReview(url, workDir = null) {
    console.log('[UX] Starting 2-stage review...');

    // ---- Stage 1: Hard Metrics ----
    let hardResult = null;
    if (workDir) {
      hardResult = await this.hardMetrics(workDir, url);

      if (!hardResult.passed) {
        console.log(`[UX] Stage 1 FAILED: ${hardResult.errors.join('; ')}`);
        return {
          stage1: hardResult,
          desktop: {
            screenshot: null,
            review: {
              scores: { visualHierarchy: 0, firstImpression: 0, usability: 0, web3UX: 0, aesthetics: 0 },
              totalScore: 0,
              topIssues: hardResult.errors,
              improvements: hardResult.errors.map(e => `Fix: ${e}`),
              summary: `Hard metrics failed:\n${hardResult.errors.join('\n')}`,
            },
          },
          mobile: null,
          combinedScore: 0,
          timestamp: new Date().toISOString(),
        };
      }
      console.log('[UX] Stage 1 PASSED — proceeding to Vision Assessment');
    }

    // ---- Stage 2: Vision Assessment ----
    const desktopPath = await this.takeScreenshot(url, 'desktop');
    const desktopReview = await this.reviewScreenshot(desktopPath);

    const mobilePath = await this.takeMobileScreenshot(url, 'mobile');
    const mobileReview = await this.reviewScreenshot(mobilePath);

    const combinedScore = Math.round(desktopReview.totalScore * 0.6 + mobileReview.totalScore * 0.4);

    return {
      stage1: hardResult,
      desktop: {
        screenshot: desktopPath,
        review: desktopReview,
      },
      mobile: {
        screenshot: mobilePath,
        review: mobileReview,
      },
      combinedScore,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
