import { spawn } from 'child_process'
import os from 'os'

export interface HyperVMonitorState {
  isRunning: boolean
  activeVMs: Set<string> // 현재 접속 중인 VM 목록
  userName: string
  intervalId: NodeJS.Timeout | null
}

export type OnStatusChangeCallback = (activeVMs: string[], userName: string) => void

export function createHyperVMonitor(onStatusChange: OnStatusChangeCallback) {
  let state: HyperVMonitorState = {
    isRunning: false,
    activeVMs: new Set<string>(), // 현재 접속 중인 VM 목록
    userName: os.hostname(), // hostname을 그대로 전달
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

      state.activeVMs = new Set(fetchedVMs)

      // 3초마다 무조건 전체 상태 전송 (서버가 판단)
      const vmList = Array.from(state.activeVMs)
      if (vmList.length > 0) {
        console.log(`[HyperV Monitor] 💓 Heartbeat: ${vmList.length}개 사용 중 →`, vmList)
      } else {
        console.log(`[HyperV Monitor] 💤 Heartbeat: 사용 중인 VM 없음`)
      }

      onStatusChange(vmList, state.userName)
    })
  }

  const start = (): void => {
    if (state.isRunning) return
    state.isRunning = true
    console.log('[HyperV Monitor] 모니터링 시작 (3초마다 현재 상태 전송)')
    checkHyperVStatus()
    state.intervalId = setInterval(checkHyperVStatus, CHECK_INTERVAL_MS)
  }

  const stop = (): void => {
    state.isRunning = false
    if (state.intervalId) clearInterval(state.intervalId)
    state.activeVMs.clear()
    console.log('[HyperV Monitor] 모니터링 종료')
  }

  return { start, stop }
}
