import { spawn } from 'child_process'
import os from 'os'

/**
 * HyperV 모니터 상태 타입
 */
export interface HyperVMonitorState {
  isRunning: boolean
  currentVM: string | null
  userName: string
  intervalId: NodeJS.Timeout | null
}

/**
 * HyperV 상태 변경 콜백 타입
 */
export type OnStatusChangeCallback = (vmName: string, userName: string | null) => void

/**
 * HyperV 모니터 생성
 * @param onStatusChange 상태 변경 시 호출될 콜백 함수
 * @returns 모니터 제어 함수들
 */
export function createHyperVMonitor(onStatusChange: OnStatusChangeCallback) {
  // 내부 상태 (클로저로 관리)
  let state: HyperVMonitorState = {
    isRunning: false,
    currentVM: null,
    userName: os.hostname(),
    intervalId: null
  }

  const CHECK_INTERVAL_MS = 3000 // 3초마다 체크

  /**
   * PowerShell 스크립트 실행하여 HyperV 상태 확인
   */
  const checkHyperVStatus = (): void => {
    const psScript = `
      $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
      $networkConnections = Get-NetTCPConnection -RemotePort 2179 -State Established -ErrorAction SilentlyContinue;
      $results = @();
      if ($networkConnections) {
        foreach ($conn in $networkConnections) {
          $activePID = $conn.OwningProcess;
          $proc = Get-CimInstance Win32_Process -Filter "ProcessId = '$activePID' AND Name = 'vmconnect.exe'";
          if ($proc -and ($proc.CommandLine -match '"[^"]+"\\\s+"[^"]+"\\\s+"([^"]+)"')) {
            $results += $Matches[1];
          }
        }
      }
      if ($results) { $results | ConvertTo-Json } else { "[]" }
    `

    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript])

    let stdoutData = ''

    child.stdout.on('data', (data) => {
      stdoutData += data.toString()
    })

    child.on('close', () => {
      const output = stdoutData.trim()
      let currentVM: string | null = null

      try {
        if (output && output !== '[]') {
          const parsed = JSON.parse(output)
          currentVM = Array.isArray(parsed) ? parsed[0] : parsed
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 문자열 사용
        currentVM = output || null
      }

      // 상태 변화 감지 및 보고
      if (currentVM !== state.currentVM) {
        if (currentVM) {
          console.log(`[HyperV Monitor] ✅ 연결 감지: ${currentVM}에 접속 중`)
          onStatusChange(currentVM, state.userName)
        } else {
          if (state.currentVM) {
            console.log(`[HyperV Monitor] ℹ️ 연결 종료: ${state.currentVM} 세션이 종료되었습니다.`)
            onStatusChange(state.currentVM, null)
          }
        }
        state.currentVM = currentVM
      }
    })

    child.stderr.on('data', (data) => {
      console.error(`[HyperV Monitor] PowerShell 오류: ${data.toString()}`)
    })
  }

  /**
   * 모니터링 시작
   */
  const start = (): void => {
    if (state.isRunning) {
      console.log('[HyperV Monitor] 이미 실행 중입니다.')
      return
    }

    state.isRunning = true
    console.log('[HyperV Monitor] 모니터링 시작')
    console.log(`[HyperV Monitor] 사용자(호스트명): ${state.userName}`)

    // 즉시 1회 체크 후 주기적으로 실행
    checkHyperVStatus()
    state.intervalId = setInterval(checkHyperVStatus, CHECK_INTERVAL_MS)
  }

  /**
   * 모니터링 중지
   */
  const stop = (): void => {
    if (!state.isRunning) {
      console.log('[HyperV Monitor] 이미 중지 상태입니다.')
      return
    }

    state.isRunning = false
    if (state.intervalId) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }

    console.log('[HyperV Monitor] 모니터링 중지')

    // 마지막으로 연결 해제 이벤트 전송
    if (state.currentVM) {
      console.log(`[HyperV Monitor] 마지막 VM 연결 해제: ${state.currentVM}`)
      onStatusChange(state.currentVM, null)
      state.currentVM = null
    }
  }

  /**
   * 현재 모니터링 상태 반환
   */
  const getStatus = (): Readonly<HyperVMonitorState> => {
    return {
      ...state,
      intervalId: null // intervalId는 외부에 노출하지 않음
    }
  }

  // Public API 반환
  return {
    start,
    stop,
    getStatus
  }
}

/**
 * HyperV 모니터 타입
 */
export type HyperVMonitor = ReturnType<typeof createHyperVMonitor>
