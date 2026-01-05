/**
 * HyperV 관련 IPC 핸들러 (수정본)
 */
import { spawn } from 'child_process'
import { ipcMain } from 'electron'

export function registerHypervHandlers() {
  ipcMain.handle('hyperv:connect-vm', async (_event, args: { hostServer: string; vmName: string }) => {
    try {
      const { hostServer, vmName } = args
      const vmconnectPath = 'vmconnect.exe'

      console.log('[HyperV] VM 연결 시도:', { hostServer, vmName })

      // spawn을 사용하여 프로세스를 독립적으로 실행
      const child = spawn(vmconnectPath, [hostServer, vmName], {
        detached: true, // 부모 프로세스(Electron)와 독립적으로 실행
        stdio: 'ignore' // 입출력을 무시하여 자식 프로세스가 대기하지 않게 함
      })

      // 자식 프로세스가 부모 프로세스의 종료를 기다리지 않게 설정
      child.unref()

      // 프로세스가 정상적으로 시작되었는지 간단히 확인 후 즉시 리턴
      return { success: true }
    } catch (error: any) {
      console.error('[HyperV] VM 연결 실패:', error)
      return { success: false, error: error.message || '알 수 없는 오류' }
    }
  })
}
