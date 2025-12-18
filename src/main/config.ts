/**
 * 환경 설정 로드 및 관리
 */

export interface AppConfig {
  appMode: 'master' | 'client'
  serverUrl: string
  vacationSiteUrl?: string
  taskSiteUrl?: string
  teamMembers?: string[]
}

/**
 * 환경 변수에서 설정 로드
 */
export function loadConfig(): AppConfig {
  const appMode = (process.env.APP_MODE || 'client') as 'master' | 'client'
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'

  const config: AppConfig = {
    appMode,
    serverUrl
  }

  // Master 모드 전용 설정
  if (appMode === 'master') {
    config.vacationSiteUrl = process.env.VACATION_SITE_URL
    config.taskSiteUrl = process.env.TASK_SITE_URL
    config.teamMembers = process.env.TEAM_MEMBERS ? process.env.TEAM_MEMBERS.split(',').map((m) => m.trim()) : []
  }

  return config
}

/**
 * 전역 설정 객체
 */
export const config = loadConfig()

/**
 * Master 모드 여부 확인
 */
export const isMasterMode = (): boolean => {
  return config.appMode === 'master'
}

/**
 * 설정 유효성 검사
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.serverUrl) {
    errors.push('SERVER_URL이 설정되지 않았습니다.')
  }

  if (config.appMode === 'master') {
    if (!config.vacationSiteUrl) {
      errors.push('Master 모드: VACATION_SITE_URL이 설정되지 않았습니다.')
    }
    if (!config.taskSiteUrl) {
      errors.push('Master 모드: TASK_SITE_URL이 설정되지 않았습니다.')
    }
    if (!config.teamMembers || config.teamMembers.length === 0) {
      errors.push('Master 모드: TEAM_MEMBERS가 설정되지 않았습니다.')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
