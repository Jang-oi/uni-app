import { useEffect, useRef, useState } from 'react'
import { ArrowRight01Icon, PackageIcon, RefreshIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVersionStore } from '../stores/version'

const SKIP_VERSION_KEY = 'skip-update-config'

export function VersionUpdateDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [skipForToday, setSkipForToday] = useState(false)
  const isListenerSet = useRef(false)

  // Zustand Store 상태 구독
  const {
    currentVersion,
    updateAvailable,
    availableVersion,
    history,
    isChecking,
    isDownloading,
    downloadProgress,
    isDownloaded,
    setIsChecking,
    setUpdateAvailable,
    setDownloadProgress,
    setIsDownloading,
    setIsDownloaded
  } = useVersionStore()

  // 1. Electron 메인 프로세스의 업데이트 이벤트 리스너 설정
  useEffect(() => {
    if (isListenerSet.current) return
    isListenerSet.current = true

    window.api.onChecking(() => setIsChecking(true))
    window.api.onUpdateAvailable((info) => {
      setIsChecking(false)
      setUpdateAvailable(true, info.version)
    })
    window.api.onUpdateNotAvailable(() => {
      setIsChecking(false)
    })
    window.api.onDownloadProgress((p) => setDownloadProgress(Math.round(p.percent)))
    window.api.onUpdateDownloaded(() => {
      setIsDownloading(false)
      setIsDownloaded(true)
      toast.success('업데이트 파일 다운로드 완료!')
    })
    window.api.onError((err) => {
      setIsChecking(false)
      setIsDownloading(false)
      toast.error(`업데이트 중 오류 발생: ${err.message}`)
    })
  }, [])

  // 2. 업데이트 감지 시 다이얼로그 표시 여부 결정 (오늘 날짜 체크 로직 포함)
  useEffect(() => {
    if (!updateAvailable || !availableVersion) {
      setIsOpen(false)
      return
    }

    // localStorage에서 저장된 스킵 정보 확인
    const savedConfig = localStorage.getItem(SKIP_VERSION_KEY)
    if (savedConfig) {
      try {
        const { version, date } = JSON.parse(savedConfig)
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

        // 저장된 버전이 최신 버전과 같고, 저장된 날짜가 오늘이라면 다이얼로그를 띄우지 않음
        if (version === availableVersion && date === today) {
          setIsOpen(false)
          return
        }
      } catch (e) {
        localStorage.removeItem(SKIP_VERSION_KEY)
      }
    }

    setIsOpen(true)
    window.api.checkForUpdates()
  }, [updateAvailable, availableVersion])

  // '나중에' 또는 '오늘 하루 보지 않기' 클릭 시 처리
  const handleLater = () => {
    if (skipForToday) {
      const today = new Date().toISOString().split('T')[0]
      const config = {
        version: availableVersion,
        date: today
      }
      localStorage.setItem(SKIP_VERSION_KEY, JSON.stringify(config))
    }
    setIsOpen(false)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    const result = await window.api.downloadUpdate()
    if (!result.success) {
      toast.error(result.message || '다운로드 시작 실패')
      setIsDownloading(false)
    }
  }

  const handleInstall = () => {
    window.api.installUpdate()
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[480px] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="relative pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              {isDownloaded ? (
                <HugeiconsIcon icon={Tick02Icon} className="w-8 h-8" />
              ) : isDownloading ? (
                <HugeiconsIcon icon={RefreshIcon} className="w-8 h-8 animate-spin" />
              ) : (
                <HugeiconsIcon icon={PackageIcon} className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-900">
                {isDownloaded ? '설치 준비 완료' : '새로운 업데이트 발견'}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                {isDownloaded ? '지금 즉시 새로운 버전을 적용할 수 있습니다.' : `v${availableVersion} 버전으로 업데이트가 가능합니다.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 버전 비교 카드 */}
          <div className="grid grid-cols-7 items-center bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="col-span-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">현재 버전</p>
              <p className="text-base font-bold text-slate-600">v{currentVersion}</p>
            </div>
            <div className="col-span-1 flex justify-center">
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 text-slate-300" />
            </div>
            <div className="col-span-3 text-center">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">최신 버전</p>
              <p className="text-base font-bold text-primary">v{availableVersion}</p>
            </div>
          </div>

          {/* 다운로드 진행바 */}
          <AnimatePresence>
            {isDownloading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-xs font-bold px-1">
                  <span className="text-primary flex items-center gap-1">
                    <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5 animate-spin" />
                    다운로드 중...
                  </span>
                  <span className="text-slate-500">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2.5 bg-slate-100" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 업데이트 소식 리스트 */}
          {!isDownloading && history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                업데이트 소식
              </h4>
              <ScrollArea className="h-[280px] w-full rounded-lg border border-slate-100 bg-white p-3">
                <div className="space-y-4">
                  {history.map((release) => (
                    <div key={release.version} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">v{release.version}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{release.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {release.changes.map((change, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
                            <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-slate-300" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {!isDownloading && !isDownloaded && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox id="skip-today" checked={skipForToday} onCheckedChange={(checked) => setSkipForToday(checked === true)} />
              <label htmlFor="skip-today" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                오늘 하루 동안 보지 않기
              </label>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            {!isDownloaded ? (
              <>
                <Button variant="ghost" onClick={handleLater} disabled={isDownloading}>
                  나중에
                </Button>
                <Button onClick={handleDownload} disabled={isDownloading || isChecking}>
                  {isDownloading ? '다운로드 중...' : <>지금 업데이트 시작</>}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleInstall}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-12 text-base font-bold animate-pulse"
              >
                설치 후 앱 재시작
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
