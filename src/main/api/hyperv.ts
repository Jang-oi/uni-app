import { appConfig } from '../config'

/**
 * HyperV 상태 업데이트 데이터 타입
 */
export interface HyperVStatusUpdate {
  vmName: string
  userName: string | null
}

/**
 * 서버에 HyperV 상태 업데이트 전송
 * @param vmName VM 이름
 * @param userName 사용자 이름 (null이면 연결 해제)
 */
export async function updateHyperVStatus(vmName: string, userName: string | null): Promise<void> {
  try {
    const response = await fetch(`${appConfig.serverUrl}/api/hyperv/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vmName,
        userName
      })
    })

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('[HyperV API] 상태 업데이트 성공:', result)
  } catch (error) {
    console.error('[HyperV API] 상태 업데이트 실패:', error)
    throw error
  }
}

/**
 * 서버에서 현재 HyperV 상태 목록 조회
 */
export async function getHyperVStatusList(): Promise<any[]> {
  try {
    const response = await fetch(`${appConfig.serverUrl}/api/hyperv/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('[HyperV API] 상태 목록 조회 성공')
    return result.data || []
  } catch (error) {
    console.error('[HyperV API] 상태 목록 조회 실패:', error)
    throw error
  }
}
