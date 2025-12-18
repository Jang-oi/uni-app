/**
 * Electron Store를 사용한 자격증명 저장
 * 크롤링 사이트 ID/PW를 암호화하여 저장
 */

import Store from 'electron-store'

interface CrawlerCredentials {
  vacationSite: {
    url: string
    id: string
    password: string
  }
  taskSite: {
    url: string
    id: string
    password: string
  }
  teamMembers: string[]
}

interface StoreSchema {
  credentials: CrawlerCredentials
}

/**
 * Electron Store 인스턴스
 * 자동으로 암호화되어 저장됨
 */
const store = new Store<StoreSchema>({
  name: 'crawler-credentials',
  encryptionKey: 'uni-app-crawler-secret-key-2025', // 운영 시 환경 변수로 관리 권장
  defaults: {
    credentials: {
      vacationSite: {
        url: '',
        id: '',
        password: ''
      },
      taskSite: {
        url: '',
        id: '',
        password: ''
      },
      teamMembers: []
    }
  }
})

/**
 * 크롤러 자격증명 저장
 */
export function saveCredentials(credentials: CrawlerCredentials): void {
  store.set('credentials', credentials)
  console.log('[Store] 자격증명 저장됨')
}

/**
 * 크롤러 자격증명 로드
 */
export function loadCredentials(): CrawlerCredentials {
  return store.get('credentials')
}

/**
 * 휴가 사이트 자격증명 저장
 */
export function saveVacationCredentials(url: string, id: string, password: string): void {
  const current = loadCredentials()
  saveCredentials({
    ...current,
    vacationSite: { url, id, password }
  })
}

/**
 * 업무 사이트 자격증명 저장
 */
export function saveTaskCredentials(url: string, id: string, password: string): void {
  const current = loadCredentials()
  saveCredentials({
    ...current,
    taskSite: { url, id, password }
  })
}

/**
 * 팀원 목록 저장
 */
export function saveTeamMembers(members: string[]): void {
  const current = loadCredentials()
  saveCredentials({
    ...current,
    teamMembers: members
  })
}

/**
 * 자격증명 초기화
 */
export function clearCredentials(): void {
  store.clear()
  console.log('[Store] 자격증명 초기화됨')
}

/**
 * 자격증명 유효성 확인
 */
export function hasValidCredentials(): boolean {
  const creds = loadCredentials()
  return !!(
    creds.vacationSite.url &&
    creds.vacationSite.id &&
    creds.vacationSite.password &&
    creds.taskSite.url &&
    creds.taskSite.id &&
    creds.taskSite.password &&
    creds.teamMembers.length > 0
  )
}
