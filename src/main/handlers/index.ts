/**
 * IPC 핸들러 통합 모듈
 * 모든 핸들러를 한 곳에서 등록
 */

import { ipcMain } from 'electron'
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

  console.log('[Handlers] 모든 IPC 핸들러 등록 완료')
}
