/**
 * 사용자 정보 관련 IPC 핸들러
 */
import { ipcMain } from 'electron'
import { getUserInfoFromServer } from '../api/user'

export function registerUserHandlers() {
  // 서버에서 사용자 정보 조회 핸들러
  ipcMain.handle('user:get-info', async () => {
    try {
      const userInfo = await getUserInfoFromServer()
      return { success: true, data: userInfo }
    } catch (error) {
      console.error('[Handler] 사용자 정보 조회 실패:', error)
      return { success: false, error }
    }
  })

  console.log('[UserHandler] 사용자 정보 핸들러 등록 완료')
}
