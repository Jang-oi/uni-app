/**
 * Renderer용 API 클라이언트
 * Express 서버와 직접 통신할 경우 사용 (현재는 IPC 사용)
 */

import axios, { AxiosInstance } from 'axios'

/**
 * Axios 인스턴스 생성 (Renderer용)
 */
const createRendererApiClient = (): AxiosInstance => {
  // Vite 환경변수 사용
  const baseURL = import.meta.env.VITE_SERVER_URL || 'http://192.168.10.30:3001'

  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export const rendererApi = createRendererApiClient()

/**
 * 월별 휴가 데이터 조회 (서버 직접 호출)
 * Express 서버 구현 후 주석 해제하여 사용
 */
export async function fetchVacationsFromServer(year: number, month: number) {
  try {
    const response = await rendererApi.get(`/api/vacations/${year}/${month}`)
    return response.data.data || []
  } catch (error) {
    console.error('[API] 휴가 조회 실패:', error)
    return []
  }
}

/**
 * 전체 업무 데이터 조회 (서버 직접 호출)
 * Express 서버 구현 후 주석 해제하여 사용
 */
export async function fetchTasksFromServer() {
  try {
    const response = await rendererApi.get('/api/tasks')
    return response.data.data || []
  } catch (error) {
    console.error('[API] 업무 조회 실패:', error)
    return []
  }
}
