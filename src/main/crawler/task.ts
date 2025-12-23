// import { syncTasksToServer } from '../api/task' // Express 서버 구현 후 주석 해제
import type { TaskRawData } from '@shared/types/data'
import { BrowserWindow } from 'electron'
import { syncTasksToServer } from '../api/task'
import { loadCredentials } from '../store'
import { executeInBrowser } from './browserUtil'

// 브라우저 인스턴스를 전역으로 관리하여 1분마다 재사용 (메모리 상주)
let browsers: { b1: BrowserWindow; b2: BrowserWindow; b3: BrowserWindow } | null = null

/**
 * 강제 지연 함수 (안정성 확보용)
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 브라우저 생성 함수
 */
const createTaskBrowser = async (show = true): Promise<BrowserWindow> => {
  return new BrowserWindow({
    width: 1400,
    height: 900,
    show: show,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
      // partition 설정 없음 -> 기본 세션 공유
    }
  })
}

/**
 * 업무 사이트 로그인 수행
 */
const performTaskLogin = async (win: BrowserWindow, id: string, pw: string): Promise<void> => {
  console.log('[Task] 로그인 정보 입력 중...')
  await executeInBrowser(
    win,
    `
    (async function() {
      const usernameField = document.querySelector("#userId");
      const passwordField = document.querySelector("#password");
      const loginButton = document.querySelector("body > div.wrap.login > div > div > div > div > form > fieldset > div.btn-area > button");

      if (usernameField && passwordField && loginButton) {
        usernameField.value = "${id}";
        passwordField.value = "${pw}";
        loginButton.click();
      }
    })()
  `
  )
}

/**
 * 데이터 조회 및 추출 함수
 */
const scrapeDataByCondition = async (win: BrowserWindow, type: 'A' | 'P', text: string = '') => {
  return await executeInBrowser(
    win,
    `
    (async function() {
      try {
        const li = document.querySelector('li[title="요청내역관리"], li[name="요청내역관리"]');
        if (!li) throw new Error('탭 메뉴를 찾을 수 없습니다.');

        const tabId = li.getAttribute('aria-controls');
        const iframe = document.getElementById(tabId);
        const iWin = iframe.contentWindow;
        const iDoc = iframe.contentDocument || iWin.document;

        if (!iWin.UNIUX) throw new Error('UNIUX 로드 대기 필요');

        // 검색 조건 설정
        iWin.UNIUX.SVC('PROGRESSION_TYPE', 'R,E,O,A,C,N,M');
        iWin.UNIUX.SVC('RECEIPT_INFO_SEARCH_TYPE', '${type}');
        iWin.UNIUX.SVC('RECEIPT_INFO_TEXT', '${text}');

        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        iWin.UNIUX.SVC('START_DATE', lastYear.toISOString().split('T')[0]);

        const searchBtn = iDoc.querySelector('#doSearch');
        if (searchBtn) searchBtn.click();

        // 로딩바가 사라질 때까지 대기
        await new Promise((resolve) => {
          const start = Date.now();
          const check = () => {
            const loading = iDoc.querySelector('.loading-area');
            const isVisible = loading && window.getComputedStyle(loading).display !== 'none';
            // 로딩바가 안보이고 최소 1.5초는 경과해야 데이터 렌더링 완료로 간주
            if (!isVisible && (Date.now() - start > 1500)) resolve();
            else if (Date.now() - start > 20000) resolve(); // 최대 20초 타임아웃
            else setTimeout(check, 200);
          };
          check();
        });

        // 그리드 데이터 반환
        return JSON.parse(JSON.stringify(iWin.grid.getAllRowValue()));
      } catch (err) {
        return { error: err.message };
      }
    })()
  `
  )
}

/**
 * 개별 팀원 리스트 순차 크롤링
 */
const crawlMemberGroup = async (win: BrowserWindow, members: string[]) => {
  const results: any = {}
  for (const name of members) {
    results[name] = await scrapeDataByCondition(win, 'P', name)
    await sleep(1000) // 다음 멤버 검색 전 여유 시간
  }
  return results
}

/**
 * 리더-팔로워 방식 브라우저 세션 초기화
 */
const prepareBrowsers = async (url: string, id: string, pw: string) => {
  if (!browsers) {
    console.log('[Task] 브라우저 신규 생성 중...')
    browsers = {
      b1: await createTaskBrowser(true),
      b2: await createTaskBrowser(true),
      b3: await createTaskBrowser(true)
    }
  }

  const { b1, b2, b3 } = browsers

  // 1. 리더(b1) 먼저 접속 및 로그인
  console.log('[Task] 리더 브라우저(b1) 로딩 시작...')
  await b1.loadURL(url)
  await sleep(4000) // 완전한 페이지 로드 대기

  const isLoginPage = await b1.webContents.executeJavaScript(`!!document.querySelector("#userId")`)
  if (isLoginPage) {
    console.log('[Task] 리더 브라우저 로그인 시도...')
    await performTaskLogin(b1, id, pw)
    await sleep(6000) // 로그인 후 세션이 쿠키에 구워질 때까지 충분히 대기
  }

  // 2. 팔로워(b2, b3) 순차 로딩 (리더의 세션을 활용)
  console.log('[Task] 팔로워 브라우저(b2, b3) 동기화 시작...')

  const setupFollower = async (win: BrowserWindow) => {
    await win.loadURL(url)
    await sleep(4000) // 접속 후 자동 로그인 상태 확인 대기
  }

  await Promise.all([setupFollower(b2), setupFollower(b3)])
}

/**
 * 메인 업무 크롤링 실행 함수
 */
export const runTaskCrawler = async (): Promise<unknown> => {
  try {
    const { taskSite, teamMembers } = loadCredentials()
    const { url, id, password } = taskSite

    // 1. 브라우저 세션 상태 및 페이지 로드 보장
    await prepareBrowsers(url, id, password)
    if (!browsers) throw new Error('브라우저 초기화 실패')

    // 2. 업무 분담 (팀원 8명 기준 예시)
    const group1 = teamMembers.slice(0, 4)
    const group2 = teamMembers.slice(4, 8)

    console.log('[Task] 3개 브라우저 동시 수집 시작...')

    // 3. 3개 브라우저 병렬 데이터 추출
    // teamTotal: "팀" 데이터용 (A 타입)
    // g1Results, g2Results: 개개인 데이터용 (P 타입)
    const [teamTotal, g1Results, g2Results] = await Promise.all([
      scrapeDataByCondition(browsers.b1, 'A'),
      crawlMemberGroup(browsers.b2, group1),
      crawlMemberGroup(browsers.b3, group2)
    ])

    // 4. 데이터 구조화 { "팀": [], "이름1": [], ... }
    const structuredData: Record<string, any> = {
      team: Array.isArray(teamTotal) ? teamTotal : []
    }

    // 개별 팀원 결과 병합
    Object.assign(structuredData, g1Results, g2Results)

    console.log('[Task] 데이터 구조화 완료. 서버 전송 시작...')

    // 4. 서버로 데이터 전송
    if (teamTotal && Array.isArray(teamTotal)) {
      console.log(`[Task] ${teamTotal.length}건의 데이터 처리 시작...`)

      const syncResult = await syncTasksToServer(teamTotal as TaskRawData[])
      console.log('[Task] 서버 동기화 완료:', syncResult)

      return {
        teamTotal: syncResult,
        individualResults: { ...g1Results, ...g2Results },
        updatedAt: new Date().toISOString()
      }
    } else {
      console.warn('[Task] 저장할 데이터가 없습니다.')
      return {
        teamTotal: { inserted: 0, updated: 0, total: 0 },
        individualResults: { ...g1Results, ...g2Results },
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('[Task] 크롤링 실행 중 오류 발생:', error)
    return {
      teamTotal: { inserted: 0, updated: 0, total: 0 },
      individualResults: {},
      updatedAt: new Date().toISOString()
    }
  }
}
