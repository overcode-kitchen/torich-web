/**
 * capture.mjs — 디자인 시스템 비포/애프터 스크린샷 캡처 (Playwright, ESM)
 *
 * 사용법:
 *   1) 의존성:  npm i playwright && npx playwright install chromium
 *   2) 개발 서버를 띄운다: pnpm dev  (기본 http://localhost:3000)
 *   3) 비포:    node capture.mjs before
 *      애프터:  node capture.mjs after
 *
 * 출력: screenshots/<out>/<화면이름>-<사이즈>-<테마>.png  (full page)
 * 사이즈: desktop 1440px · mobile 390px / 테마: light · dark
 *
 * 환경변수(선택):
 *   BASE_URL     기본 http://localhost:3000
 *   PW_CHROMIUM  chromium executablePath 직접 지정(캐시 버전 우회용)
 *   ROUTES       쉼표구분 라우트 목록으로 기본 목록 대체
 *
 * 다크모드: 앱 ThemeProvider는 로그아웃 상태에서 theme='system'으로
 *   prefers-color-scheme를 따른다 → context colorScheme로 강제한다.
 *   하이드레이션 타이밍 보정을 위해 로드 후 .dark 클래스도 직접 토글한다.
 *
 * 참고: 저장소 ESLint가 require()를 금지하므로 확장자는 .mjs(ESM)다.
 */
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OUT = process.argv[2] || 'before'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// 주요 라우트 (app/**/page.tsx 기반). 인증 게이트 화면은 로그아웃 상태가 찍힐 수 있음.
const DEFAULT_ROUTES = [
  ['home', '/'],
  ['login', '/login'],
  ['faq', '/faq'],
  ['design-system', '/design-system'],
  ['stats', '/stats'],
  ['settings', '/settings'],
  ['calendar', '/calendar'],
  ['investment', '/investment'],
  ['tory', '/tory'],
  ['goal-new', '/goal/new'],
  ['add', '/add'],
  ['notifications', '/notifications'],
]
const ROUTES = process.env.ROUTES
  ? process.env.ROUTES.split(',').map((r, i) => [`route${i}`, r.trim()])
  : DEFAULT_ROUTES

const SIZES = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]
const THEMES = ['light', 'dark']

const outDir = path.join(__dirname, 'screenshots', OUT)
fs.mkdirSync(outDir, { recursive: true })

const routeOf = (name) => ROUTES.find((x) => x[0] === name)?.[1]

async function run() {
  const launchOpts = {}
  if (process.env.PW_CHROMIUM) launchOpts.executablePath = process.env.PW_CHROMIUM
  const browser = await chromium.launch(launchOpts)
  const report = []

  for (const [sizeName, viewport] of SIZES) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      page.on('pageerror', () => {})

      for (const [name, route] of ROUTES) {
        const url = BASE_URL + route
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        } catch {
          report.push({ name, sizeName, theme, ok: false, note: 'goto-timeout' })
          continue
        }
        await page.waitForTimeout(1600)
        await page.evaluate((t) => {
          document.documentElement.classList.toggle('dark', t === 'dark')
        }, theme)
        await page.waitForTimeout(500)
        const finalUrl = page.url()
        const file = path.join(outDir, `${name}-${sizeName}-${theme}.png`)
        try {
          await page.screenshot({ path: file, fullPage: true, timeout: 20000 })
          report.push({ name, sizeName, theme, ok: true, finalUrl })
        } catch {
          try {
            await page.screenshot({ path: file, fullPage: false })
            report.push({ name, sizeName, theme, ok: true, finalUrl, note: 'viewport-only' })
          } catch {
            report.push({ name, sizeName, theme, ok: false, note: 'screenshot-fail' })
          }
        }
      }
      await context.close()
    }
  }

  await browser.close()
  fs.writeFileSync(path.join(outDir, '_report.json'), JSON.stringify(report, null, 2))
  const ok = report.filter((r) => r.ok).length
  console.log(`captured ${ok}/${report.length} → ${outDir}`)
  for (const r of report.filter((x) => x.ok && x.finalUrl && !x.finalUrl.endsWith(routeOf(x.name)))) {
    console.log(`  ↪ ${r.name} redirected → ${r.finalUrl}`)
  }
}

run().catch((e) => {
  console.error('capture failed:', e.message)
  process.exit(1)
})
