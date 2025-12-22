import { spawn } from 'child_process'
import os from 'os'

export interface HyperVMonitorState {
  isRunning: boolean
  activeVMs: Set<string> // 단일 string 대신 Set 사용
  userName: string
  intervalId: NodeJS.Timeout | null
}

export type OnStatusChangeCallback = (vmName: string, userName: string | null) => void

export function createHyperVMonitor(onStatusChange: OnStatusChangeCallback) {
  let state: HyperVMonitorState = {
    isRunning: false,
    activeVMs: new Set<string>(), // 현재 접속 중인 VM 목록
    userName: os.hostname(),
    intervalId: null
  }

  const CHECK_INTERVAL_MS = 3000

  const checkHyperVStatus = (): void => {
    const psScript = `
      $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
      $networkConnections = Get-NetTCPConnection -RemotePort 2179 -State Established -ErrorAction SilentlyContinue;
      $results = @();
      if ($networkConnections) {
        foreach ($conn in $networkConnections) {
          $activePID = $conn.OwningProcess;
          $proc = Get-CimInstance Win32_Process -Filter "ProcessId = '$activePID' AND Name = 'vmconnect.exe'";
          if ($proc -and ($proc.CommandLine -match '"[^"]+"\\s+"[^"]+"\\s+"([^"]+)"')) {
            $results += $matches[1];
          }
        }
      }
      $results | ConvertTo-Json
    `

    const child = spawn('powershell.exe', ['-Command', psScript])
    let stdoutData = ''

    child.stdout.on('data', (data) => {
      stdoutData += data.toString()
    })

    child.on('close', () => {
      const output = stdoutData.trim()
      let fetchedVMs: string[] = []

      try {
        if (output && output !== '[]') {
          const parsed = JSON.parse(output)
          fetchedVMs = Array.isArray(parsed) ? parsed : [parsed]
        }
      } catch (e) {
        console.error('JSON 파싱 에러:', e)
      }

      const currentVMSet = new Set(fetchedVMs)

      // 1. 제거된 VM 찾기 (기존에 있었는데 현재 결과에는 없는 것)
      state.activeVMs.forEach((vm) => {
        if (!currentVMSet.has(vm)) {
          console.log(`[HyperV Monitor] 연결 종료 감지: ${vm}`)
          onStatusChange(vm, null) // 서버에 종료 알림
          state.activeVMs.delete(vm)
        }
      })

      // 2. 새로 추가된 VM 찾기 (현재 결과에는 있는데 기존 목록에는 없는 것)
      currentVMSet.forEach((vm) => {
        if (!state.activeVMs.has(vm)) {
          console.log(`[HyperV Monitor] 새 연결 감지: ${vm}`)
          onStatusChange(vm, state.userName) // 서버에 사용 시작 알림
          state.activeVMs.add(vm)
        }
      })
    })
  }

  const start = (): void => {
    if (state.isRunning) return
    state.isRunning = true
    console.log('[HyperV Monitor] 다중 모니터링 시작')
    checkHyperVStatus()
    state.intervalId = setInterval(checkHyperVStatus, CHECK_INTERVAL_MS)
  }

  const stop = (): void => {
    state.isRunning = false
    if (state.intervalId) clearInterval(state.intervalId)

    // 종료 시 모든 활성 VM 연결 해제 보고
    state.activeVMs.forEach((vm) => {
      onStatusChange(vm, null)
    })
    state.activeVMs.clear()
  }

  return { start, stop }
}
