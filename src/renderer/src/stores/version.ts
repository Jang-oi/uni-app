/**
 * 버전 관리 Zustand 스토어
 */

import { create } from 'zustand'

// 서버 데이터와 일치하는 인터페이스
export interface VersionHistory {
  version: string
  date: string
  changes: string[]
}

interface VersionInfo {
  currentVersion: string
  releases: VersionHistory[]
}

interface VersionStore {
  // 버전 데이터
  currentVersion: string
  history: VersionHistory[]

  // 업데이트 상태
  isChecking: boolean
  updateAvailable: boolean
  availableVersion: string
  isDownloading: boolean
  downloadProgress: number
  isDownloaded: boolean
  lastCheckTime: string

  // Actions
  setVersionInfo: (info: VersionInfo) => void
  setIsChecking: (isChecking: boolean) => void
  setUpdateAvailable: (available: boolean, version?: string) => void
  setDownloadProgress: (progress: number) => void
  setIsDownloading: (isDownloading: boolean) => void
  setIsDownloaded: (isDownloaded: boolean) => void
  setLastCheckTime: (time: string) => void
  resetUpdateState: () => void

  // 초기화
  initVersion: () => Promise<void>
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  currentVersion: '',
  history: [],
  isChecking: false,
  updateAvailable: false,
  availableVersion: '',
  isDownloading: false,
  downloadProgress: 0,
  isDownloaded: false,
  lastCheckTime: '확인 전',

  setVersionInfo: (info) =>
    set({
      currentVersion: info.currentVersion,
      history: info.releases || []
    }),

  setIsChecking: (isChecking) => set({ isChecking }),

  setUpdateAvailable: (available, version = '') =>
    set({
      updateAvailable: available,
      availableVersion: version
    }),

  setDownloadProgress: (progress) => set({ downloadProgress: progress }),

  setIsDownloading: (isDownloading) => set({ isDownloading }),

  setIsDownloaded: (isDownloaded) => set({ isDownloaded }),

  setLastCheckTime: (time) => set({ lastCheckTime: time }),

  resetUpdateState: () =>
    set({
      isChecking: false,
      updateAvailable: false,
      availableVersion: '',
      isDownloading: false,
      downloadProgress: 0,
      isDownloaded: false
    }),

  initVersion: async () => {
    try {
      const result = await window.api.getVersion()
      if (result.success && result.versionInfo) {
        get().setVersionInfo(result.versionInfo)
      }
    } catch (error) {
      console.error('[Version Store] 버전 정보 로드 실패:', error)
    }
  }
}))
