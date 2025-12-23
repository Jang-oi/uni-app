/**
 * 관리자 인증 관련 IPC 핸들러
 */

import { ipcMain } from 'electron'
import { appConfig } from '../config'

export function registerAdminHandlers() {
  /**
   * 관리자 비밀번호 확인
   */
  ipcMain.handle('admin:verify-password', async (_event, password: string) => {
    const isValid = password === appConfig.adminPassword
    console.log('[Admin] 비밀번호 인증:', isValid ? '성공' : '실패')
    return { success: isValid }
  })
}
