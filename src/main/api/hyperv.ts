import { api, ApiResponse } from '@shared/api/client'

/**
 * 서버에 HyperV 전체 상태 전송 (Heartbeat)
 */
export async function sendHyperVHeartbeat(activeVMs: string[], userName: string): Promise<void> {
  try {
    const response = await api.post<ApiResponse>('/api/hyperv/heartbeat', {
      userName,
      activeVMs
    })

    if (response.data.success) {
      console.log(`[HyperV] Heartbeat 성공: ${activeVMs.length}개 VM (${userName})`)
    }
  } catch (error) {
    console.error('[HyperV] Heartbeat 전송 오류:', error)
  }
}
