import { useEffect, useRef, useState } from 'react'
import { Loading03Icon, Message02Icon, PackageIcon, RefreshIcon, WifiOff01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Toaster } from '@/components/ui/sonner'
import { useVersionStore } from '@/stores/version'

export function ServerErrorPage() {
  const isListenerSet = useRef(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  // 버전 스토어에서 상태 가져오기
  const currentVersion = useVersionStore((state) => state.currentVersion)
  const isChecking = useVersionStore((state) => state.isChecking)
  const updateAvailable = useVersionStore((state) => state.updateAvailable)
  const availableVersion = useVersionStore((state) => state.availableVersion)
  const isDownloading = useVersionStore((state) => state.isDownloading)
  const downloadProgress = useVersionStore((state) => state.downloadProgress)
  const isDownloaded = useVersionStore((state) => state.isDownloaded)

  // 버전 스토어 액션
  const setIsChecking = useVersionStore((state) => state.setIsChecking)
  const setUpdateAvailable = useVersionStore((state) => state.setUpdateAvailable)
  const setDownloadProgress = useVersionStore((state) => state.setDownloadProgress)
  const setIsDownloading = useVersionStore((state) => state.setIsDownloading)
  const setIsDownloaded = useVersionStore((state) => state.setIsDownloaded)

  // Electron 업데이트 이벤트 리스너 등록
  useEffect(() => {
    if (isListenerSet.current) return
    isListenerSet.current = true

    window.api.onChecking(() => setIsChecking(true))
    window.api.onUpdateAvailable((info) => {
      setIsChecking(false)
      setUpdateAvailable(true, info.version)
      toast.success(`새 버전 v${info.version}이 준비되었습니다.`, { id: 'upd-toast' })
    })
    window.api.onUpdateNotAvailable(() => {
      setIsChecking(false)
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
  }, [setIsChecking, setUpdateAvailable, setDownloadProgress, setIsDownloading, setIsDownloaded])

  const handleReconnect = () => {
    setIsReconnecting(true)
    console.log('[ServerError] 재연결 시도 중...')

    // 페이지 새로고침으로 재연결 시도
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2 border-slate-200">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* 귀여운 아이콘 애니메이션 */}
            <motion.div
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50" />
                <HugeiconsIcon icon={WifiOff01Icon} className="w-24 h-24 text-red-500 relative z-10" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900">서버 연결 실패</CardTitle>
              <CardDescription className="text-base">앗! 서버에 연결할 수 없어요 😢</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 오류 설명 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HugeiconsIcon icon={Message02Icon} className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-red-900">
                  <p className="font-semibold">다음 사항을 확인해주세요:</p>
                  <ul className="space-y-1 list-disc list-inside text-red-800">
                    <li>서버가 실행 중인지 확인</li>
                    <li>네트워크 연결 상태 확인</li>
                    <li>방화벽 설정 확인</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버전 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={PackageIcon} className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900">현재 버전</p>
                    <p className="text-sm font-bold text-blue-700">v{currentVersion}</p>
                  </div>
                </div>
                {updateAvailable && (
                  <Badge variant="destructive" className="animate-pulse">
                    v{availableVersion} 사용 가능
                  </Badge>
                )}
              </div>
            </div>

            {/* 재연결 버튼 */}
            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center">서버가 복구되었다면 재연결을 시도하거나, 업데이트를 확인해보세요.</p>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleReconnect} variant="outline" disabled={isReconnecting}>
                  {isReconnecting ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                      재연결 중...
                    </>
                  ) : (
                    '재연결 시도'
                  )}
                </Button>

                {!updateAvailable ? (
                  <Button onClick={() => window.api.checkForUpdates()} disabled={isChecking} variant="outline">
                    <HugeiconsIcon icon={RefreshIcon} className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                    업데이트 확인
                  </Button>
                ) : !isDownloaded ? (
                  <Button
                    onClick={() => {
                      setIsDownloading(true)
                      window.api.downloadUpdate()
                    }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? `다운로드 중... ${downloadProgress}%` : '지금 업데이트'}
                  </Button>
                ) : (
                  <Button onClick={() => window.api.installUpdate()} className="bg-emerald-600 hover:bg-emerald-700">
                    설치 및 재시작
                  </Button>
                )}
              </div>

              {isDownloading && (
                <div className="space-y-1">
                  <Progress value={downloadProgress} className="h-2" />
                  <p className="text-xs text-slate-500 text-center">{downloadProgress}% 완료</p>
                </div>
              )}
            </div>

            {/* 추가 정보 */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                서버 정보가 변경된 경우 업데이트가 필요할 수 있습니다.
                <br />
                문제가 지속되면 담당자에게 문의하세요.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 귀여운 장식 요소 */}
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-center mt-6"
        >
          <span className="text-4xl">🔌💔</span>
        </motion.div>
      </motion.div>
      <Toaster position="top-right" richColors theme={'light'} />
    </div>
  )
}
