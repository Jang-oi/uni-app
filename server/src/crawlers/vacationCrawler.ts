import puppeteer, { Browser, Page } from 'puppeteer'
import { loadCredentials } from '@/config/credentials'
import { sleep } from '@/utils/puppeteerUtil'

/**
 * 브라우저 생성 (일회성 실행을 위해 별도 브라우저 인스턴스 사용)
 */
const createVacationBrowser = async (): Promise<Browser> => {
  return await puppeteer.launch({
    headless: true,
    // 서로 다른 경로를 지정하여 세션 및 리소스 완전 분리
    userDataDir: './.puppeteer/vacation_session',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ],
    defaultViewport: { width: 1280, height: 800 }
  })
}

/**
 * 로그인 상태 확인 및 수행 (TaskCrawler와 동일한 스타일)
 */
const ensureLogin = async (page: Page): Promise<void> => {
  const { vacationSite } = loadCredentials()
  const isLoginPage = await page.evaluate(() => !!document.getElementById('login_id'))

  if (isLoginPage) {
    console.log('[Vacation] 로그인 시도 중...')
    await page.evaluate((id, pw) => {
      const idInput = document.getElementById('login_id') as HTMLInputElement
      const pwInput = document.getElementById('password') as HTMLInputElement
      const loginBtn = document.getElementsByClassName('btn-login')[0] as HTMLElement
      if (idInput && pwInput) {
        idInput.value = id
        pwInput.value = pw
        loginBtn.click()
      }
    }, vacationSite.id, vacationSite.password)
  }
}

/**
 * 메인 크롤링 실행 함수
 */
export const runVacationCrawler = async () => {
  let browser: Browser | null = null
  let page: Page | null = null

  try {
    const { vacationSite } = loadCredentials()

    // 1. 실행할 때마다 브라우저 오픈
    browser = await createVacationBrowser()
    page = await browser.newPage()
    await page.goto(vacationSite.url, { waitUntil: 'networkidle2' })

    // 2. 로그인 및 이동
    await ensureLogin(page)

    const avsLinkSelector = 'a.id-svcLink[svcid="AVS"]'
    await page.waitForSelector(avsLinkSelector, { timeout: 20000 })
    await page.click(avsLinkSelector)

    // 대시보드 로드 대기 (TaskCrawler의 waitForFunction 패턴 적용 가능)
    await page.waitForSelector('div.dashboard', { timeout: 15000 })
    await sleep(1000)
    return await fetchVacationData(page);

  } catch (error) {
    console.error('[Vacation] 크롤링 실패:', error)
    return { inserted: 0, updated: 0, total: 0 }
  } finally {
    // 5. 작업 종료 후 브라우저 완전 종료 (리소스 반환)
    if (browser) await browser.close()
  }
}

/**
 * 내부 API 호출 로직
 */
const fetchVacationData = async (page: Page): Promise<unknown> => {
  const today = new Date()
  const sSdate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
  const sEdate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]

  return await page.evaluate(async (sDate, eDate) => {
    const body = {
      coRegno: '1048621562',
      deptId: '000909',
      usId: '',
      sSdate: sDate,
      sEdate: eDate,
      itemIds: [
        '2673DED180C14058A5492AD0C6593D45', '01A614219FAE435E991B16B84956D5E4',
        '5F451BD3A3A042C889FDCD8334FE5826', 'CC63430C4EB746E8BCF2629483F6C646',
        'B4D79AED292B8991E050E7DE961F6DAB', 'B4D79AED292D8991E050E7DE961F6DAB',
        '2A65F1A08644427EB79313D8DED9F5DA'
      ],
      userStatus: '10',
      procSts: 'S'
    }
    const response = await fetch('https://leave.unipost.co.kr/unicloud/avs/report/getMonthReportAvsUse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return await response.json()
  }, sSdate, sEdate)
}