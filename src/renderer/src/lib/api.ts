/**
 * API 클라이언트 유틸리티
 * 서버와의 HTTP 통신을 담당
 */

export const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * 기본 fetch 래퍼 함수
 */
const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    return data
  } catch (error) {
    console.error('[API Error]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    }
  }
}

/**
 * GET 요청
 */
export const get = <T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> => {
  const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint
  return fetchApi<T>(url, { method: 'GET' })
}

/**
 * POST 요청
 */
export const post = <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * PUT 요청
 */
export const put = <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * DELETE 요청
 */
export const del = <T>(endpoint: string): Promise<ApiResponse<T>> => {
  return fetchApi<T>(endpoint, { method: 'DELETE' })
}

/**
 * API 엔드포인트 모음
 */
export const api = {
  /**
   * 휴가 API
   */
  vacation: {
    /**
     * 월별 휴가 데이터 조회
     */
    getByMonth: (year: string, month: string) => get<VacationDto[]>('/api/vacations', { year, month }),

    /**
     * 휴가 데이터 동기화 (Master 전용)
     */
    sync: (vacations: unknown[]) => post('/api/vacations/sync', { vacations })
  },

  /**
   * 업무 API (향후 구현)
   */
  task: {
    getAll: () => get('/api/tasks'),
    getById: (id: string) => get(`/api/tasks/${id}`),
    create: (task: unknown) => post('/api/tasks', task),
    update: (id: string, task: unknown) => put(`/api/tasks/${id}`, task),
    delete: (id: string) => del(`/api/tasks/${id}`)
  }
}

/**
 * 휴가 DTO (서버에서 전달받는 형식)
 */
export type VacationDto = {
  useId: string
  usName: string
  deptName: string
  itemName: string
  useSdate: string // YYYY-MM-DD
  useEdate: string // YYYY-MM-DD
  useStime: string | null
  useEtime: string | null
  useDesc: string
  useTimeTypeName?: string
}
