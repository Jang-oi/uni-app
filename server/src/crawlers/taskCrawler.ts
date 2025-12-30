import puppeteer, { Browser, Page } from 'puppeteer'
import { loadCredentials } from '@/config/credentials'
import { sleep } from '@/utils/puppeteerUtil'
import {TaskDisplayData} from "@/types/task";
import {processTaskData} from "@/services/taskService";

let browser: Browser | null = null
let sharedPage: Page | null = null // 단일 탭 유지를 위한 변수
let isInitialized = false

const MAX_RETRIES = 2 // 실패 시 재시도 횟수

/**
 * 시스템 초기화: 브라우저를 실행하고 단 하나의 탭(Page)만 생성합니다.
 */
export const initializeTaskSystem = async (): Promise<void> => {
  if (isInitialized && browser) return
  const { taskSite } = loadCredentials()

  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    userDataDir: './.puppeteer/task_session',
    defaultViewport: { width: 1400, height: 900 }
  })

  // 기존 여러 개 생성하던 로직을 제거하고 단 하나만 생성
  sharedPage = await browser.newPage()
  sharedPage.setDefaultNavigationTimeout(60000)

  // 로그인 페이지 이동 및 로그인 수행
  await sharedPage.goto(taskSite.url, { waitUntil: 'networkidle2' })
  await ensureLogin(sharedPage)

  isInitialized = true
  console.log(`[Task] 초기화 완료: 단일 탭 준비됨.`)
}

/**
 * 로그인 로직 (기존과 동일)
 */
const ensureLogin = async (page: Page): Promise<void> => {
  const { taskSite } = loadCredentials()
  const isLoginPage = await page.evaluate(() => !!document.querySelector('#userId'))

  if (isLoginPage) {
    await page.evaluate((id, pw) => {
      const idInput = document.querySelector('#userId') as HTMLInputElement
      const pwInput = document.querySelector('#password') as HTMLInputElement
      const btn = document.querySelector('button.btn-login, .btn-area button') as HTMLElement
      if (idInput && pwInput) {
        idInput.value = id
        pwInput.value = pw
        btn?.click()
      }
    }, taskSite.id, taskSite.password)
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
  }
}

/**
 * 시스템 객체 로딩 대기 (기존과 동일)
 */
const waitForSystemReady = async (page: Page) => {
  await page.waitForFunction(() => {
    const li = document.querySelector('li[title="요청내역관리"], li[name="요청내역관리"]')
    const tabId = li?.getAttribute('aria-controls')
    if (!tabId) return false
    const iWin = (document.getElementById(tabId) as any)?.contentWindow
    return iWin && iWin.UNIUX && iWin.grid
  }, { timeout: 15000 }).catch(() => {
    throw new Error('시스템 객체(UNIUX/Grid) 로드 타임아웃')
  })
}

/**
 * 데이터 스크래핑 로직 (기존과 동일)
 */
const scrapeData = async (page: Page, type: 'A' | 'P', text: string = ''): Promise<TaskDisplayData[]> => {
  await waitForSystemReady(page)

  await page.evaluate(async (t, txt) => {
    const li = document.querySelector('li[title="요청내역관리"]')
    const tabId = li?.getAttribute('aria-controls')!
    const iframe = document.getElementById(tabId) as HTMLIFrameElement
    const iWin = iframe.contentWindow as any
    const iDoc = iframe.contentDocument || iWin.document

    iWin.UNIUX.SVC('PROGRESSION_TYPE', 'R,E,O,A,C,N,M')
    iWin.UNIUX.SVC('RECEIPT_INFO_SEARCH_TYPE', t)
    iWin.UNIUX.SVC('RECEIPT_INFO_TEXT', txt.trim())

    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    iWin.UNIUX.SVC('START_DATE', lastYear.toISOString().split('T')[0])
    const searchBtn = iDoc.querySelector('#doSearch') as HTMLElement
    searchBtn?.click()

  }, type, text)

  const timeOut = type === 'A' ? 10000 : 3000
  await sleep(timeOut)

  return await page.evaluate(() => {
    const li = document.querySelector('li[title="요청내역관리"]')
    const tabId = li?.getAttribute('aria-controls')
    const iWin = (document.getElementById(tabId!) as any)?.contentWindow
    return iWin?.grid?.getAllRowValue() || []
  })
}

/**
 * 개별 크롤링 재시도 (기존과 동일)
 */
const scrapeWithRetry = async (page: Page, type: 'A' | 'P', text: string): Promise<TaskDisplayData[]> => {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await scrapeData(page, type, text)
    } catch (error) {
      if (attempt > MAX_RETRIES) throw error
      console.warn(`[Task] ${text || '팀'} 수집 실패, 재시도 중... (${attempt}/${MAX_RETRIES})`)
      await page.reload({ waitUntil: 'networkidle2' })
    }
  }
  return []
}

/**
 * 메인 실행 함수: 단일 탭에서 팀원 리스트를 순차적으로 처리합니다.
 */
export const runTaskCrawler = async () => {
  try {
    const { teamMembers } = loadCredentials()
    if (!isInitialized || !sharedPage) await initializeTaskSystem()

    const page = sharedPage!
    console.log(`[Task] 단일 탭 수집 시작... (총 ${teamMembers.length}명)`)

    const teamData = await scrapeWithRetry(page, 'A', '')
    const memberResults: Record<string, TaskDisplayData[]> = {}

    for (const name of teamMembers) {
      try {
        console.log(`[Task] ${name} 수집 중...`)
        memberResults[name] = await scrapeWithRetry(page, 'P', name)
      } catch (err: any) {
        console.error(`[Task] ${name} 최종 수집 실패:`, err.message)
        memberResults[name] = []
      }
    }

    return processTaskData({
      team : teamData,
      members: memberResults,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Task] 크롤러 실행 에러:', error)
    return { teamData: [], memberData: {}, lastUpdated: new Date().toISOString() }
  }
}