/**
 * 자격증명 관리 관련 IPC 핸들러
 */

import { ipcMain } from 'electron'
import { hasValidCredentials, loadCredentials, saveCredentials } from '../store'

export function registerCredentialsHandlers() {
  /**
   * 저장된 자격증명 로드
   */
  ipcMain.handle('credentials:load', async () => {
    const creds = loadCredentials()
    console.log('[Credentials] 자격증명 로드')
    return { success: true, data: creds }
  })

  /**
   * 자격증명 저장
   */
  ipcMain.handle('credentials:save', async (_event, credentials) => {
    saveCredentials(credentials)
    console.log('[Credentials] 자격증명 저장됨')
    return { success: true }
  })

  /**
   * 자격증명 유효성 확인
   */
  ipcMain.handle('credentials:validate', async () => {
    const isValid = hasValidCredentials()
    return { success: true, isValid }
  })
}
