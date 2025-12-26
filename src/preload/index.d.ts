import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // 관리자 인증
      verifyAdminPassword: (password: string) => Promise<{ success: boolean }>

      // 자격증명 관리
      loadCredentials: () => Promise<{ success: boolean; data: any }>
      saveCredentials: (credentials: any) => Promise<{ success: boolean }>
      validateCredentials: () => Promise<{ success: boolean; isValid: boolean }>

      // 크롤러 제어
      startCrawlerScheduler: () => Promise<{ success: boolean; message?: string }>
      stopCrawlerScheduler: () => Promise<{ success: boolean; message?: string }>
      runVacationCrawler: () => Promise<{ success: boolean; message?: string }>
      runTaskCrawler: () => Promise<{ success: boolean; message?: string }>
      getCrawlerStatus: () => Promise<{ success: boolean; isRunning: boolean }>

      // Supabase 데이터 조회
      getVacations: (year: string, month: string) => Promise<{ success: boolean; data: any[]; error?: string }>
      getVacationsCount: () => Promise<{ success: boolean; count: number; error?: string }>
      getTasks: () => Promise<{ success: boolean; data: any[]; error?: string }>
      getTasksByUser: (usId: string) => Promise<{ success: boolean; data: any[]; error?: string }>
      getTasksCount: () => Promise<{ success: boolean; count: number; error?: string }>

      // HyperV 모니터
      getHyperVStatus: () => Promise<{
        success: boolean
        data?: {
          isRunning: boolean
          currentVM: string | null
          userName: string
        }
        error?: string
      }>
      startHyperVMonitor: () => Promise<{ success: boolean; error?: string }>
      stopHyperVMonitor: () => Promise<{ success: boolean; error?: string }>
      getHyperVList: () => Promise<{ success: boolean; data: any[]; error?: string }>

      // 사용자 정보
      getUserName: () => Promise<string>

      // 외부 URL 열기
      openExternal: (url: string) => Promise<{ success: boolean; error?: any }>

      // 자동 업데이트
      getVersion: () => Promise<{ success: boolean; version: string }>
      checkForUpdates: () => Promise<{ success: boolean; message?: string }>
      downloadUpdate: () => Promise<{ success: boolean; message?: string }>
      installUpdate: () => Promise<{ success: boolean; message?: string }>

      // 업데이트 이벤트 리스너
      onChecking: (callback: () => void) => () => void
      onUpdateAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes: any }) => void) => () => void
      onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
      onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void
      onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void
      onError: (callback: (error: { message: string }) => void) => () => void
    }
  }
}
