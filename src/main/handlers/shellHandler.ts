/**
 * Shell 관련 IPC 핸들러
 */
import { ipcMain, shell } from 'electron'

export function registerShellHandlers() {
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

  console.log('[ShellHandler] Shell 핸들러 등록 완료')
}
