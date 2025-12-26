import { useState } from 'react'
import { Loading03Icon, Message02Icon, WifiOff01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ServerErrorPage() {
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = () => {
    setIsReconnecting(true)
    console.log('[ServerError] 재연결 시도 중...')

    // 페이지 새로고침으로 재연결 시도
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleContactAdmin = () => {
    // TODO: 담당자 연락 기능 (카카오톡, 이메일 등)
    console.log('담당자에게 연락하기')
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

            {/* 재연결 버튼 */}
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-600">서버가 복구되었다면 재연결을 시도해보세요.</p>

              <Button onClick={handleReconnect} className="w-full" size="lg" disabled={isReconnecting}>
                {isReconnecting ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="w-5 h-5 mr-2 animate-spin" />
                    재연결 중...
                  </>
                ) : (
                  '재연결 시도'
                )}
              </Button>

              <Button onClick={handleContactAdmin} className="w-full" size="lg" variant="outline">
                담당자에게 연락하기
              </Button>
            </div>

            {/* 추가 정보 */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                서버 연결이 복구되면 자동으로 재시도됩니다.
                <br />
                잠시만 기다려주세요.
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
    </div>
  )
}
