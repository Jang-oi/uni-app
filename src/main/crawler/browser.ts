/**
 * BrowserWindow 기반 크롤러 (숨김 모드)
 * 로그인 세션 유지 및 DOM 조작
 */

import { BrowserWindow } from 'electron'

class CrawlerBrowser {
  private window: BrowserWindow | null = null

  /**
   * 크롤링 브라우저 초기화
   */
  async init(): Promise<void> {
    if (this.window) {
      return
    }

    this.window = new BrowserWindow({
      width: 1280,
      height: 800,
      show: true, // 숨김 모드
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      }
    })

    console.log('[CrawlerBrowser] 초기화 완료')
  }

  /**
   * URL로 이동
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.window) {
      throw new Error('Browser not initialized')
    }

    await this.window.loadURL(url)
    console.log('[CrawlerBrowser] 페이지 로드:', url)
  }

  /**
   * JavaScript 실행 및 결과 반환
   */
  async executeScript<T>(script: string): Promise<T> {
    if (!this.window) {
      throw new Error('Browser not initialized')
    }

    const result = await this.window.webContents.executeJavaScript(script)
    return result as T
  }

  /**
   * 로그인 여부 확인
   */
  async checkLogin(): Promise<boolean> {
    if (!this.window) {
      return false
    }

    try {
      const isLoggedIn = await this.executeScript<boolean>(`
        (function() {
          // 로그인 상태 확인 로직
          // 예: 로그인 버튼이 없으면 로그인된 상태
          const loginButton = document.querySelector('.login-button');
          return loginButton === null;
        })()
      `)

      return isLoggedIn
    } catch (error) {
      console.error('[CrawlerBrowser] 로그인 확인 오류:', error)
      return false
    }
  }

  /**
   * 페이지 대기 (특정 selector가 나타날 때까지)
   */
  async waitForSelector(selector: string, timeout = 10000): Promise<boolean> {
    if (!this.window) {
      return false
    }

    try {
      const found = await this.executeScript<boolean>(`
        (function() {
          return new Promise((resolve) => {
            const startTime = Date.now();
            const checkElement = setInterval(() => {
              const element = document.querySelector('${selector}');
              if (element) {
                clearInterval(checkElement);
                resolve(true);
              } else if (Date.now() - startTime > ${timeout}) {
                clearInterval(checkElement);
                resolve(false);
              }
            }, 100);
          });
        })()
      `)

      return found
    } catch (error) {
      console.error('[CrawlerBrowser] Selector 대기 오류:', error)
      return false
    }
  }

  /**
   * 현재 페이지 URL 가져오기
   */
  getCurrentURL(): string {
    if (!this.window) {
      return ''
    }

    return this.window.webContents.getURL()
  }

  /**
   * 브라우저 종료
   */
  destroy(): void {
    if (this.window) {
      this.window.destroy()
      this.window = null
      console.log('[CrawlerBrowser] 종료됨')
    }
  }

  /**
   * 개발 모드: 브라우저 표시 (디버깅용)
   */
  show(): void {
    if (this.window) {
      this.window.show()
    }
  }

  /**
   * 개발 모드: DevTools 열기 (디버깅용)
   */
  openDevTools(): void {
    if (this.window) {
      this.window.webContents.openDevTools()
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
export const crawlerBrowser = new CrawlerBrowser()
