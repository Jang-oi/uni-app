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

export interface releases {
  version: string
  date: string
  changes: string[]
}

export interface VersionInfo {
  currentVersion: string
  latestVersion?: string
  isLatest: boolean
  releases: releases[]
}
