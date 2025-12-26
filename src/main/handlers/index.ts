/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import { ipcMain, shell } from 'electron'
import { getUserName } from '../config'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function registerAllHandlers() {
  registerVersionHandlers()

  // 사용자 정보 조회 핸들러
  ipcMain.handle('user:get-name', () => {
    return getUserName()
  })

  // 외부 URL 열기 핸들러
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('[Shell] 외부 URL 열기 실패:', error)
      return { success: false, error }
    }
  })

  console.log('[Handlers] 모든 IPC 핸들러 등록 완료')
}
