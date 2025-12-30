import type { Page } from 'puppeteer'

/**
 * 특정 셀렉터가 나타날 때까지 대기하는 함수
 */
export const waitForSelector = async (
  page: Page,
  selector: string,
  timeout = 10000
): Promise<boolean> => {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch (error) {
    console.warn(`[Puppeteer] 셀렉터를 찾을 수 없음: ${selector}`, error)
    return false
  }
}

/**
 * 특정 엘리먼트를 클릭하는 함수
 */
export const clickElement = async (page: Page, selector: string): Promise<void> => {
  try {
    await page.click(selector)
  } catch (error) {
    console.error(`[Puppeteer] 클릭 실패: ${selector}`, error)
    throw error
  }
}

/**
 * 페이지 스크린샷 촬영 (디버깅용)
 */
export const takeScreenshot = async (page: Page, filename: string): Promise<void> => {
  await page.screenshot({ path: filename, fullPage: true })
  console.log(`[Puppeteer] 스크린샷 저장: ${filename}`)
}

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute JavaScript in page context
 */
export const executeInPage = async <T>(page: Page, script: string | Function, ...args: any[]): Promise<T> => {
  return await page.evaluate(script as any, ...args)
}
