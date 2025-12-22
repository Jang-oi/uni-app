import { api } from './client'
import type { ApiResponse } from './client'

/**
 * 서버에 HyperV 상태 업데이트 전송 (Axios 사용)
 */
export async function updateHyperVStatus(vmName: string, userName: string | null): Promise<void> {
  try {
    // client.ts에 정의된 api.post 사용
    const response = await api.post<ApiResponse>('/api/hyperv/status', {
      vmName,
      userName
    })

    if (response.data.success) {
      console.log(`[HyperV] ${vmName} 상태 업데이트 성공`)
    }
  } catch (error) {
    console.error('[HyperV] 서버 전송 오류:', error)
  }
}

/**
 * 서버에서 현재 목록 조회 (필요시 사용)
 */
export async function getHyperVStatusList(): Promise<any[]> {
  try {
    const response = await api.get<ApiResponse<any[]>>('/api/hyperv/status')
    return response.data.data || []
  } catch (error) {
    console.error('[HyperV] 목록 조회 오류:', error)
    return []
  }
}
