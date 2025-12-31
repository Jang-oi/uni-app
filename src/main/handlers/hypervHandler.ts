/**
 * HyperV 관련 IPC 핸들러
 */
import { exec } from 'child_process'
import { ipcMain } from 'electron'

export function registerHypervHandlers() {
  /**
   * HyperV VM 연결
   * vmconnect.exe를 실행하여 특정 호스트의 VM에 연결
   */
  ipcMain.handle('hyperv:connect-vm', async (_event, args: { hostServer: string; vmName: string }) => {
    try {
      const { hostServer, vmName } = args

      // vmconnect.exe 경로 (보통 System32에 있음)
      const vmconnectPath = 'vmconnect.exe'
      const command = `"${vmconnectPath}" "${hostServer}" "${vmName}"`

      console.log('[HyperV] VM 연결 시도:', { hostServer, vmName, command })

      // Promise로 감싸서 실행 완료를 기다림
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('[HyperV] vmconnect 실행 오류:', error)
            console.error('[HyperV] stderr:', stderr)
            reject(error)
          } else {
            console.log('[HyperV] vmconnect 실행 성공')
            if (stdout) console.log('[HyperV] stdout:', stdout)
            resolve(null)
          }
        })
      })

      return { success: true }
    } catch (error: any) {
      console.error('[HyperV] VM 연결 실패:', error)
      return { success: false, error: error.message || '알 수 없는 오류' }
    }
  })

  console.log('[HypervHandler] HyperV 핸들러 등록 완료')
}
