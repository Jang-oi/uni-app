/**
 * 공통 API 클라이언트 (Axios 기반)
 * Express 서버와의 통신을 위한 재사용 가능한 HTTP 클라이언트
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Axios 인스턴스 생성
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.SERVER_URL || 'http://192.168.10.30:3001'

  const instance = axios.create({
    baseURL,
    timeout: 10000, // 10초 타임아웃
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 요청 인터셉터 (로깅)
  instance.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
      return config
    },
    (error) => {
      console.error('[API Request Error]', error)
      return Promise.reject(error)
    }
  )

  // 응답 인터셉터 (로깅 및 에러 핸들링)
  instance.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`)
      return response
    },
    (error) => {
      if (error.response) {
        // 서버가 응답했지만 에러 상태 코드
        console.error(`[API Error] ${error.response.status} ${error.response.config.url}`, error.response.data)
      } else if (error.request) {
        // 요청은 보냈지만 응답이 없음
        console.error('[API Error] No response received', error.request)
      } else {
        // 요청 설정 중 에러 발생
        console.error('[API Error]', error.message)
      }
      return Promise.reject(error)
    }
  )

  return instance
}

/**
 * API 클라이언트 싱글톤
 */
export const apiClient = createApiClient()

/**
 * 공통 API 호출 유틸리티
 */
export const api = {
  /**
   * GET 요청
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config)
  },

  /**
   * POST 요청
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config)
  },

  /**
   * PUT 요청
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config)
  },

  /**
   * DELETE 요청
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config)
  }
}

/**
 * API 응답 타입 (공통)
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
