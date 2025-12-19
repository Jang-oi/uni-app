import { BrowserWindow } from 'electron'

/**
 * 스크립트 실행 유틸리티
 */
export const executeInBrowser = async <T>(win: BrowserWindow, script: string): Promise<T> => {
  return await win.webContents.executeJavaScript(script)
}

/**
 * 특정 셀렉터가 나타날 때까지 대기하는 함수
 */
export const waitForSelector = async (win: BrowserWindow, selector: string, timeout = 10000): Promise<boolean> => {
  return await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector('${selector}');
        if (el) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - startTime > ${timeout}) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    })
  `);
};

/**
 * 특정 엘리먼트를 클릭하는 함수
 */
export const clickElement = async (win: BrowserWindow, selector: string): Promise<void> => {
  await win.webContents.executeJavaScript(`
    (function() {
      const el = document.querySelector('${selector}');
      if (el) {
        el.click();
      } else {
        console.error('클릭할 엘리먼트를 찾을 수 없음: ${selector}');
      }
    })()
  `);
};
