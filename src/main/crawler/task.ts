import { loadCredentials } from '../store'
import {BrowserWindow} from "electron";
import {executeInBrowser, waitForSelector} from "./browserUtil";

const createTaskBrowser = async (show = false): Promise<BrowserWindow> => {
  return new BrowserWindow({
    width: 1280,
    height: 800,
    show: show,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })
}

/**
 * 업무 사이트 로그인 수행
 */
const performTaskLogin = async (win: BrowserWindow, id: string, pw: string): Promise<void> => {
  console.log('[Task] 로그인 시도 중...')
  await executeInBrowser(win, `
    (function() {
      const idInput = document.getElementById('login_id');
      const pwInput = document.getElementById('password');
      const loginBtn = document.getElementsByClassName('btn-login')[0];
      if (idInput && pwInput && loginBtn) {
        idInput.value = '${id}';
        pwInput.value = '${pw}';
        loginBtn.click();
      }
    })()
  `)
}

/**
 * 업무 데이터 조회 API 호출 (POST)
 */
const fetchTaskData = async (win: BrowserWindow): Promise<unknown> => {
  // 사용자가 요청했던 POST 데이터 구조 적용
  const requestBody = {
    coRegno: "1048621562",
    deptId: "000909",
    // 업무 크롤링에 필요한 다른 파라미터가 있다면 여기 수정
    userStatus: "10",
    procSts: "S"
  }

  return await executeInBrowser(win, `
    fetch('/api/task/list/url', { // 업무용 실제 API 엔드포인트로 수정 필요
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(${JSON.stringify(requestBody)})
    }).then(res => res.json())
  `)
}

/**
 * 메인 업무 크롤링 실행 함수
 */
export const runTaskCrawler = async (): Promise<unknown> => {
  let browser: BrowserWindow | null = null

  try {
    const credentials = loadCredentials()
    const { url, id, password } = credentials.taskSite

    // 1. 브라우저 시작
    browser = await createTaskBrowser(true)
    await browser.loadURL(url)

    // 2. 로그인 수행
    await performTaskLogin(browser, id, password)

    // 3. 로그인 후 특정 엘리먼트(예: 메뉴 버튼) 대기
    const menuReady = await waitForSelector(browser, 'a.id-svcLink[svcid="TASK"]') // svcid는 실제 업무 서비스 코드로 변경
    if (!menuReady) throw new Error('업무 사이트 로그인 확인 실패')

    // 4. 업무 메뉴 클릭 (필요 시)
    await executeInBrowser(browser, `document.querySelector('a.id-svcLink[svcid="TASK"]').click()`)

    // 5. 페이지 이동 및 대시보드 로딩 대기
    const dashboardReady = await waitForSelector(browser, 'div.dashboard')
    if (!dashboardReady) throw new Error('업무 대시보드 로딩 실패')

    // 6. API 호출 및 결과 반환
    const result = await fetchTaskData(browser)
    console.log('[Task] 데이터 수집 완료:', result)

    return result
  } catch (error) {
    console.error('[Task] 크롤링 오류:', error)
    return null // TS7030 방지
  } finally {
    // if (browser) browser.destroy()
  }
}
