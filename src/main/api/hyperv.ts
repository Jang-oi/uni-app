import os from 'os'
import { api, ApiResponse } from '@shared/api/client'

/**
 * 서버에 HyperV 전체 상태 전송 (Heartbeat)
 */
export async function sendHyperVHeartbeat(activeVMs: string[], userName: string): Promise<void> {
  try {
    const hostname = os.hostname()

    await api.post<ApiResponse>('/api/hyperv/heartbeat', {
      userName,
      activeVMs,
      hostname // hostname 추가
    })
  } catch (error) {
    console.error('[HyperV] Heartbeat 전송 오류:', error)
  }
}
