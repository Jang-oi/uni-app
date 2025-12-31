/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API 타입 정의
interface ElectronAPI {
  openExternal: (url: string) => Promise<{ success: boolean; error?: any }>
  showNotification: (args: { title: string; body: string; taskId?: string }) => Promise<{ success: boolean; error?: any }>
  setBadgeCount: (count: number, badgeData: string | null) => Promise<{ success: boolean; error?: any }>
  getHostname: () => Promise<string>
  getUserInfo: () => Promise<{ success: boolean; data?: any; error?: any }>
  getVersion: () => Promise<{ success: boolean; versionInfo?: any; error?: any }>
  checkForUpdates: () => Promise<any>
  downloadUpdate: () => Promise<any>
  installUpdate: () => Promise<any>
  onChecking: (callback: () => void) => () => void
  onUpdateAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes: any }) => void) => () => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
  onDownloadProgress: (
    callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void
  ) => () => void
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void
  onError: (callback: (error: { message: string }) => void) => () => void
}

interface Window {
  api: ElectronAPI
}
