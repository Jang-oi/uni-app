import { BrowserWindow } from 'electron'
import { loadCredentials } from '../store'
import type { VacationRawData } from '../supabase/types'
import { syncVacationsToSupabase } from '../supabase/vacation'
import { clickElement, executeInBrowser, waitForSelector } from './browserUtil'

const createVacationBrowser = async (show = false): Promise<BrowserWindow> => {
  return new BrowserWindow({
    width: 1280,
    height: 800,
    show: show,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
}

/**
 * 로그인 처리를 수행하는 함수
 */
const performLogin = async (win: BrowserWindow, id: string, pw: string): Promise<void> => {
  console.log('[Vacation] 로그인 시도 중...')
  await executeInBrowser(
    win,
    `
    (async function() {
      const idInput = document.getElementById('login_id');
      const pwInput = document.getElementById('password');
      const loginBtn = document.getElementsByClassName('btn-login')[0];

      idInput.value = '${id}';
      pwInput.value = '${pw}';
      loginBtn.click();
    })()
  `
  )
}

/**
 * API를 통해 데이터를 조회하는 함수
 */
const fetchVacationData = async (win: BrowserWindow): Promise<unknown> => {
  const today = new Date()

  const sSdateObj = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const sSdate = sSdateObj.toISOString().split('T')[0]

  const sEdateObj = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  const sEdate = sEdateObj.toISOString().split('T')[0]

  const requestBody = {
    coRegno: '1048621562',
    deptId: '000909',
    usId: '',
    sSdate,
    sEdate,
    itemIds: [
      '2673DED180C14058A5492AD0C6593D45',
      '01A614219FAE435E991B16B84956D5E4',
      '5F451BD3A3A042C889FDCD8334FE5826',
      'CC63430C4EB746E8BCF2629483F6C646',
      'B4D79AED292B8991E050E7DE961F6DAB',
      'B4D79AED292D8991E050E7DE961F6DAB',
      '2A65F1A08644427EB79313D8DED9F5DA'
    ],
    userStatus: '10',
    procSts: 'S'
  }

  return await executeInBrowser(
    win,
    `
    fetch('https://leave.unipost.co.kr/unicloud/avs/report/getMonthReportAvsUse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(${JSON.stringify(requestBody)})
    }).then(res => res.json())
  `
  )
}

/**
 * 메인 크롤링 실행 함수 (외부에서 호출)
 */
export const runVacationCrawler = async (): Promise<unknown> => {
  let browser: BrowserWindow | null = null

  try {
    const credentials = loadCredentials()
    const { url, id, password } = credentials.vacationSite

    // 1. 브라우저 초기화 및 이동
    browser = await createVacationBrowser(true)
    await browser.loadURL(url)

    // 2. 로그인 수행
    await performLogin(browser, id, password)
    console.log('[Vacation] 로그인 처리 대기 중...')

    const avsLinkSelector = 'a.id-svcLink[svcid="AVS"]'

    await new Promise((resolve) => setTimeout(resolve, 3000))
    const loginSuccess = await waitForSelector(browser, avsLinkSelector)
    if (!loginSuccess) throw new Error('로그인에 실패했거나 인사관리 링크를 찾을 수 없습니다.')

    console.log('[Vacation] 로그인 확인 완료')
    await clickElement(browser, avsLinkSelector)
    const pageLoaded = await waitForSelector(browser, 'div.dashboard')
    if (!pageLoaded) throw new Error('데이터 페이지 로딩에 실패했습니다.')

    // 4. 데이터 조회 API 호출
    const result = (await fetchVacationData(browser)) as {
      message?: string
      response?: VacationRawData[]
      status?: string
    }
    console.log('[Vacation] 조회 결과 데이터:', result)

    // 5. Supabase에 저장
    if (result && result.response && Array.isArray(result.response)) {
      console.log(`[Vacation] ${result.response.length}건의 데이터를 Supabase에 저장 시작...`)
      const syncResult = await syncVacationsToSupabase(result.response)
      console.log('[Vacation] Supabase 저장 완료:', syncResult)
      return syncResult
    } else {
      console.warn('[Vacation] 저장할 데이터가 없습니다.', result)
      return { inserted: 0, updated: 0, total: 0 }
    }
  } catch (error) {
    console.error('[Vacation] 크롤링 실패:', error)
    return { inserted: 0, updated: 0, total: 0 }
  } finally {
    if (browser) browser.destroy()
  }
}
