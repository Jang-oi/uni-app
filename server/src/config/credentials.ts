/**
 * 크롤링 사이트 인증 정보
 * 환경 변수 또는 설정 파일에서 로드
 */

export interface VacationSiteCredentials {
  url: string
  id: string
  password: string
}

export interface TaskSiteCredentials {
  url: string
  id: string
  password: string
}

export interface Credentials {
  vacationSite: VacationSiteCredentials
  taskSite: TaskSiteCredentials
  teamMembers: string[]
}

/**
 * 환경 변수에서 credentials 로드
 * 실제 환경에서는 .env 파일이나 안전한 저장소에서 로드하세요
 */
export const loadCredentials = (): Credentials => {
  // Parse team members from comma-separated string
  const teamMembersStr = process.env.TEAM_MEMBERS || ''
  const teamMembers = teamMembersStr.split(',').map(name => name.trim()).filter(name => name.length > 0)

  return {
    vacationSite: {
      url: process.env.VACATION_SITE_URL || '',
      id: process.env.VACATION_SITE_ID || '',
      password: process.env.VACATION_SITE_PASSWORD || ''
    },
    taskSite: {
      url: process.env.TASK_SITE_URL || '',
      id: process.env.TASK_SITE_ID || '',
      password: process.env.TASK_SITE_PASSWORD || ''
    },
    teamMembers
  }
}
