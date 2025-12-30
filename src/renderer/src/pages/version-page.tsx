import { useEffect, useRef, useState } from 'react'
import { Alert01Icon, DeveloperIcon, PackageIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '../components/page-header'

// 서버 데이터와 일치하는 인터페이스
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

  const isListenerSet = useRef(false)

  const loadVersionData = async () => {
    try {
      const result = await window.api.getVersion()
      if (result.success && result.versionInfo) {
        setCurrentVersion(result.versionInfo.currentVersion)
        setHistory(result.versionInfo.releases || [])
      }
    } catch (error) {
      console.error('버전 정보 로드 실패:', error)
    }
  }

  useEffect(() => {
    loadVersionData()

    if (isListenerSet.current) return
    isListenerSet.current = true

    // 중복 알림 방지를 위해 toast id 설정
    window.api.onChecking(() => setIsChecking(true))
    window.api.onUpdateAvailable((info) => {
      setIsChecking(false)
      setUpdateAvailable(true)
      setAvailableVersion(info.version)
      setLastCheckTime('방금 전')
      toast.success(`새 버전 v${info.version}이 준비되었습니다.`, { id: 'upd-toast' })
    })
    window.api.onUpdateNotAvailable(() => {
      setIsChecking(false)
      setLastCheckTime('방금 전')
      toast.info('최신 버전을 이용 중입니다.', { id: 'upd-toast' })
    })
    window.api.onDownloadProgress((p) => setDownloadProgress(Math.round(p.percent)))
    window.api.onUpdateDownloaded(() => {
      setIsDownloading(false)
      setIsDownloaded(true)
      toast.success('업데이트 다운로드 완료!', { id: 'upd-toast' })
    })
    window.api.onError((err) => {
      setIsChecking(false)
      toast.error(`오류 발생: ${err.message}`, { id: 'upd-toast' })
    })
  }, [])

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50/30">
      <PageHeader
        title="버전 관리"
        description="업데이트 내역을 확인하고 최신 버전을 유지하세요."
        icon={<HugeiconsIcon icon={PackageIcon} size={20} />}
      />

      {/* 상태 요약 카드 */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 border-none shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <HugeiconsIcon icon={PackageIcon} size={32} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">v{currentVersion}</h2>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {updateAvailable ? (
                <Badge variant="destructive" className="animate-pulse">
                  업데이트 가능 (v{availableVersion})
                </Badge>
              ) : (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">최신 버전</Badge>
              )}
              <span className="text-[11px] text-slate-400 font-medium">체크: {lastCheckTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-none shadow-sm ring-1 ring-slate-200 flex items-center p-6">
          {!updateAvailable ? (
            <Button onClick={() => window.api.checkForUpdates()} disabled={isChecking} className="w-full" variant="outline">
              <HugeiconsIcon icon={RefreshIcon} size={16} className={`mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              업데이트 확인
            </Button>
          ) : !isDownloaded ? (
            <div className="w-full space-y-2">
              <Button onClick={() => window.api.downloadUpdate()} disabled={isDownloading} className="w-full">
                {isDownloading ? `다운로드 중... ${downloadProgress}%` : '지금 업데이트'}
              </Button>
              {isDownloading && <Progress value={downloadProgress} className="h-1" />}
            </div>
          ) : (
            <Button onClick={() => window.api.installUpdate()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              설치 및 재시작
            </Button>
          )}
        </Card>
      </div>

      {/* 히스토리 목록 */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <HugeiconsIcon icon={DeveloperIcon} size={16} className="text-primary" /> 업데이트 히스토리
        </h3>
        <ScrollArea className="h-[calc(80vh-80px)]">
          <div className="space-y-8 relative ml-3 border-l-2 border-slate-100 pl-8 pb-10">
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <HugeiconsIcon icon={Alert01Icon} size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">히스토리가 없습니다.</p>
              </div>
            ) : (
              history.map((item, index) => (
                <div key={item.version} className="relative">
                  <div
                    className={`absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-white border-4 ${index === 0 ? 'border-primary' : 'border-slate-200'}`}
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold text-slate-900">v{item.version}</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                    <ul className="space-y-2">
                      {item.changes.map((change, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                          <span>{change}</span>
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
