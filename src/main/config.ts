/**
 * 환경 설정 로드 및 관리
 * 런타임 관리자 모드 지원
 */

export interface AppConfig {
  serverUrl: string
  adminPassword: string // 관리자 메뉴 접근 비밀번호
}

/**
 * 환경 변수에서 설정 로드
 */
export function loadConfig(): AppConfig {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123' // 기본값 (운영 시 반드시 변경)

  return {
    serverUrl,
    adminPassword
  }
}

/**
 * 전역 설정 객체
 */
export const config = loadConfig()

/**
 * 런타임 Master 모드 상태
 */
let isMasterModeActive = false

/**
 * Master 모드 활성화
 */
export function enableMasterMode(): void {
  isMasterModeActive = true
  console.log('[Config] Master 모드 활성화됨')
}

/**
 * Master 모드 비활성화
 */
export function disableMasterMode(): void {
  isMasterModeActive = false
  console.log('[Config] Master 모드 비활성화됨')
}

/**
 * Master 모드 여부 확인
 */
export function isMasterMode(): boolean {
  return isMasterModeActive
}

/**
 * 설정 유효성 검사
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.serverUrl) {
    errors.push('SERVER_URL이 설정되지 않았습니다.')
  }

  if (!config.adminPassword || config.adminPassword === 'admin123') {
    errors.push('경고: ADMIN_PASSWORD를 안전한 비밀번호로 변경하세요.')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
