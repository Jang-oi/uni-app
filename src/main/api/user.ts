import os from 'os'
import { api, ApiResponse } from '@shared/api/client'

export interface UserInfo {
  hostname: string
  userName: string | null
  isRegistered: boolean
}

/**
 * 서버에서 현재 hostname에 해당하는 사용자 정보 조회
 */
export async function getUserInfoFromServer(): Promise<UserInfo> {
  try {
    const hostname = os.hostname()

    const response = await api.post<ApiResponse<UserInfo>>('/api/user/info', {
      hostname
    })

    if (response.data.success && response.data.data) {
      console.log(`[User] 사용자 정보 조회 성공:`, response.data.data)
      return response.data.data
    }

    // 서버에서 사용자를 찾지 못한 경우
    console.warn(`[User] 등록되지 않은 hostname: ${hostname}`)
    return {
      hostname,
      userName: null,
      isRegistered: false
    }
  } catch (error) {
    console.error('[User] 사용자 정보 조회 오류:', error)
    const hostname = os.hostname()
    return {
      hostname,
      userName: null,
      isRegistered: false
    }
  }
}
