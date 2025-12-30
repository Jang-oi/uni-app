/**
 * 버전 관리 및 자동 업데이트 관련 IPC 핸들러
 */

import { GitHubRelease, VersionInfo } from '@shared/types/github'
import { ipcMain } from 'electron'
import { checkForUpdates, downloadUpdate, getCurrentVersion, installUpdate } from '../updater'

const GITHUB_REPO = 'Jang-oi/uni-app'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`

/**
 * GitHub Releases 목록 가져오기
 */
async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API 오류: ${response.status}`)
    }

    const releases: GitHubRelease[] = await response.json()
    return releases.filter((r) => !r.prerelease)
  } catch (error) {
    console.error('[GitHub] 릴리즈 정보 가져오기 실패:', error)
    return []
  }
}

/**
 * 마크다운 body에서 리스트 아이템만 추출하는 헬퍼 함수
 */
function parseReleaseNotes(body: string): string[] {
  if (!body) return ['릴리즈 노트가 없습니다.']

  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-') || line.startsWith('*'))
    .map((line) => line.replace(/^[-*]\s+/, '')) // 불렛 기호 제거
}

export function registerVersionHandlers() {
  /**
   * 현재 버전 조회
   */
  ipcMain.handle('updater:get-version', async () => {
    const currentVersion = getCurrentVersion()
    const rawReleases = await fetchGitHubReleases()

    // 데이터 변환: 프론트엔드에서 사용하기 편한 형태로 가공
    const releases = rawReleases.map((r) => ({
      version: r.tag_name.replace(/^v/, ''),
      date: new Date(r.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      changes: parseReleaseNotes(r.body)
    }))

    let latestVersion: string | undefined
    let isLatest = true

    if (releases.length > 0) {
      latestVersion = releases[0].version
      isLatest = currentVersion === latestVersion
    }

    console.log(releases)

    const versionInfo: VersionInfo = {
      currentVersion,
      latestVersion,
      isLatest,
      releases
    }

    return { success: true, versionInfo }
  })

  /**
   * 업데이트 확인
   */
  ipcMain.handle('updater:check', async () => {
    try {
      console.log('[Updater] 업데이트 확인 시작')
      await checkForUpdates()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 확인 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '업데이트 확인 실패' }
    }
  })

  /**
   * 업데이트 다운로드
   */
  ipcMain.handle('updater:download', async () => {
    try {
      console.log('[Updater] 업데이트 다운로드 시작')
      await downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 다운로드 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '다운로드 실패' }
    }
  })

  /**
   * 업데이트 설치 및 재시작
   */
  ipcMain.handle('updater:install', async () => {
    try {
      console.log('[Updater] 업데이트 설치 시작')
      installUpdate()
      return { success: true }
    } catch (error) {
      console.error('[Updater] 업데이트 설치 실패:', error)
      return { success: false, message: error instanceof Error ? error.message : '설치 실패' }
    }
  })
}
