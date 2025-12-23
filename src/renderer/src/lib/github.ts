/**
 * GitHub Releases API 유틸리티
 */

import type { ChangelogItem, GitHubRelease } from '@shared/types/github'

const GITHUB_REPO = 'Jang-oi/uni-app'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`

/**
 * GitHub Releases 목록 가져오기
 */
export async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
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
 * 버전 타입 판별 (major, minor, patch)
 */
function getVersionType(version: string): 'major' | 'minor' | 'patch' {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return 'patch'

  const [, , minor, patch] = match
  if (patch !== '0') return 'patch'
  if (minor !== '0') return 'minor'
  return 'major'
}

/**
 * 릴리즈 본문을 변경사항 배열로 파싱
 */
function parseReleaseBody(body: string): string[] {
  const lines = body.split('\n').filter((line) => line.trim())
  const changes: string[] = []

  for (const line of lines) {
    // - 로 시작하는 줄만 추출
    if (line.trim().startsWith('-')) {
      const change = line.trim().substring(1).trim()
      if (change) changes.push(change)
    }
  }

  // 변경사항이 없으면 전체 본문을 하나의 항목으로
  if (changes.length === 0 && body.trim()) {
    changes.push(body.trim())
  }

  return changes
}

/**
 * GitHub Releases를 Changelog 형식으로 변환
 */
export function convertToChangelogs(releases: GitHubRelease[]): ChangelogItem[] {
  return releases.map((release) => ({
    version: release.tag_name.replace(/^v/, ''),
    date: new Date(release.published_at).toISOString().split('T')[0],
    type: getVersionType(release.tag_name),
    changes: parseReleaseBody(release.body),
    url: release.html_url
  }))
}
