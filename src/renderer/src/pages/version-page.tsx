import { useEffect, useState } from 'react'
import { CheckmarkCircle02Icon, DeveloperIcon, Download02Icon, PackageIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '../components/page-header'

interface VersionHistory {
  version: string
  date: string
  changes: string[]
}

export function VersionPage() {
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [history, setHistory] = useState<VersionHistory[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [availableVersion, setAvailableVersion] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<string>('확인 전')

  // 초기 데이터 로드
  useEffect(() => {
    loadVersionData()
    setupUpdateListeners()
  }, [])

  const loadVersionData = async () => {
    // 현재 버전 가져오기
    const versionResult = await window.api.getVersion()
    if (versionResult.success) {
      setCurrentVersion(versionResult.version)
    }

    // 버전 히스토리 가져오기
    const historyResult = await window.api.getVersionHistory()
    if (historyResult.success) {
      setHistory(historyResult.history)
    }
  }

  const setupUpdateListeners = () => {
    // 업데이트 확인 중
    window.api.onChecking(() => {
      setIsChecking(true)
    })

    // 업데이트 가능
    window.api.onUpdateAvailable((info) => {
      setIsChecking(false)
      setUpdateAvailable(true)
      setAvailableVersion(info.version)
      setLastCheckTime('방금 전')
      toast.success(`새 버전 ${info.version}이(가) 출시되었습니다!`)
    })

    // 업데이트 없음
    window.api.onUpdateNotAvailable(() => {
      setIsChecking(false)
      setUpdateAvailable(false)
      setLastCheckTime('방금 전')
      toast.info('이미 최신 버전을 사용 중입니다.')
    })

    // 다운로드 진행
    window.api.onDownloadProgress((progress) => {
      setDownloadProgress(Math.round(progress.percent))
    })

    // 다운로드 완료
    window.api.onUpdateDownloaded((info) => {
      setIsDownloading(false)
      setIsDownloaded(true)
      toast.success(`버전 ${info.version} 다운로드 완료!`)
    })

    // 에러
    window.api.onError((error) => {
      setIsChecking(false)
      setIsDownloading(false)
      toast.error(`업데이트 오류: ${error.message}`)
    })
  }

  const handleCheckUpdate = async () => {
    setIsChecking(true)
    const result = await window.api.checkForUpdates()
    if (!result.success) {
      setIsChecking(false)
      toast.error(result.message || '업데이트 확인 실패')
    }
  }

  const handleDownloadUpdate = async () => {
    setIsDownloading(true)
    const result = await window.api.downloadUpdate()
    if (!result.success) {
      setIsDownloading(false)
      toast.error(result.message || '다운로드 실패')
    }
  }

  const handleInstallUpdate = async () => {
    const result = await window.api.installUpdate()
    if (!result.success) {
      toast.error(result.message || '설치 실패')
    }
  }

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="버전 관리"
        description="애플리케이션의 업데이트 내역과 최신 버전을 확인하세요."
        icon={<HugeiconsIcon icon={PackageIcon} size={20} />}
      />

      <div className="grid grid-cols-3 gap-5 mb-8">
        <Card className="col-span-2 border-slate-200 shadow-none bg-primary/5 border-dashed border-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                <HugeiconsIcon icon={PackageIcon} size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Version</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">v{currentVersion || '0.0.0'}</h2>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {updateAvailable ? (
                <Badge className="bg-destructive hover:bg-destructive text-white border-0 px-3">
                  <HugeiconsIcon icon={Download02Icon} size={12} className="mr-1" /> v{availableVersion} 업데이트 가능
                </Badge>
              ) : (
                <Badge className="bg-primary hover:bg-primary text-white border-0 px-3">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="mr-1" /> 최신 버전 사용 중
                </Badge>
              )}
              <span className="text-xs text-slate-400 font-medium">마지막 확인: {lastCheckTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-slate-200 shadow-none">
          <CardContent className="p-6 flex flex-col gap-3">
            <Button onClick={handleCheckUpdate} disabled={isChecking || isDownloading} className="w-full" variant="outline" size="sm">
              <HugeiconsIcon icon={RefreshIcon} size={16} className={`mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? '확인 중...' : '업데이트 확인'}
            </Button>

            {updateAvailable && !isDownloaded && (
              <Button onClick={handleDownloadUpdate} disabled={isDownloading} className="w-full" size="sm">
                <HugeiconsIcon icon={Download02Icon} size={16} className="mr-2" />
                {isDownloading ? `다운로드 중... ${downloadProgress}%` : '다운로드'}
              </Button>
            )}

            {isDownloaded && (
              <Button onClick={handleInstallUpdate} className="w-full bg-primary hover:bg-primary/90" size="sm">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mr-2" />
                설치 및 재시작
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={DeveloperIcon} size={16} /> 업데이트 히스토리
        </h3>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 relative ml-3 border-l-2 border-slate-100 pl-8 pb-10">
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">버전 히스토리가 없습니다.</p>
              </div>
            ) : (
              history.map((item, index) => (
                <div key={item.version} className="relative">
                  <div
                    className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 ${
                      index === 0 ? 'border-primary' : 'border-slate-300'
                    }`}
                  />
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-black text-slate-900">v{item.version}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{item.date}</span>
                    {index === 0 && <Badge className="h-5 text-[9px] bg-primary">최신</Badge>}
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <ul className="space-y-2">
                      {item.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="text-sm text-slate-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
