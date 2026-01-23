import { useEffect, useRef, useState } from 'react'
import { Loading03Icon, Message02Icon, PackageIcon, WifiOff01Icon } from '@hugeicons/core-free-icons'
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
  const isReconnectingRef = useRef(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const {
    currentVersion,
    updateAvailable,
    availableVersion,
    isDownloading,
    downloadProgress,
    isDownloaded,
    setIsChecking,
    setUpdateAvailable,
    setDownloadProgress,
    setIsDownloading,
    setIsDownloaded
  } = useVersionStore()

  // 재연결 함수
  const handleReconnect = () => {
    if (isReconnectingRef.current) return
    isReconnectingRef.current = true
    setIsReconnecting(true)

    // 페이지 새로고침으로 재연결 시도
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // Electron 업데이트 이벤트 리스너 등록
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
      toast.success('업데이트 다운로드 완료!', { id: 'upd-toast' })
    })
    window.api.onError((err) => {
      setIsChecking(false)
      setIsDownloading(false)
      toast.error(`오류 발생: ${err.message}`, { id: 'upd-toast' })
    })

    // 앱 포커스 시 자동 재연결 시도
    window.api.onAppFocused(() => {
      handleReconnect()
    })

    // 페이지 로드 시 자동으로 업데이트 확인
    window.api.checkForUpdates()
  }, [setIsChecking, setUpdateAvailable, setDownloadProgress, setIsDownloading, setIsDownloaded])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-8">
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
                <HugeiconsIcon icon={Message02Icon} className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
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

            {/* 재연결/업데이트 버튼 */}
            <div className="space-y-3">
              {updateAvailable ? (
                // 업데이트 있을 때
                <>
                  <p className="text-sm text-slate-600 text-center">새 버전이 있습니다. 업데이트 후 다시 시도해주세요.</p>
                  {!isDownloaded ? (
                    <Button
                      onClick={() => {
                        setIsDownloading(true)
                        window.api.downloadUpdate()
                      }}
                      disabled={isDownloading}
                      className="w-full"
                    >
                      {isDownloading ? `다운로드 중... ${downloadProgress}%` : `v${availableVersion} 업데이트`}
                    </Button>
                  ) : (
                    <Button onClick={() => window.api.installUpdate()} className="w-full">
                      설치 및 재시작
                    </Button>
                  )}
                  {isDownloading && (
                    <div className="space-y-1">
                      <Progress value={downloadProgress} className="h-2" />
                      <p className="text-xs text-slate-500 text-center">{downloadProgress}% 완료</p>
                    </div>
                  )}
                </>
              ) : (
                // 업데이트 없을 때 - 재연결만
                <>
                  <p className="text-sm text-slate-600 text-center">
                    서버가 복구되었다면 재연결을 시도해주세요.
                    <br />
                    <span className="text-xs text-slate-400">앱 포커스 시 자동으로 재연결을 시도합니다.</span>
                  </p>
                  <Button onClick={handleReconnect} disabled={isReconnecting} className="w-full">
                    {isReconnecting ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 mr-2 animate-spin" />
                        재연결 중...
                      </>
                    ) : (
                      '재연결 시도'
                    )}
                  </Button>
                </>
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
      </motion.div>
      <Toaster position="top-right" richColors theme={'light'} />
    </div>
  )
}
