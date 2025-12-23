/**
 * GitHub Releases API 타입 정의
 */

export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  prerelease: boolean
}

export interface ChangelogItem {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: string[]
  url: string
}
