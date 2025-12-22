import { api } from './client'
import type { ApiResponse } from './client'

/**
 * 서버에 HyperV 상태 업데이트 전송
 */
export async function updateHyperVStatus(vmName: string, userName: string | null): Promise<void> {
  try {
    const response = await api.post<ApiResponse>('/api/hyperv/status', {
      vmName,
      userName
    })

    if (response.data.success) console.log(`[HyperV] ${vmName} 상태 업데이트 성공`)
  } catch (error) {
    console.error('[HyperV] 서버 전송 오류:', error)
  }
}
