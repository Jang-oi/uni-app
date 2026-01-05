import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface VMRequestProgressProps {
  vmName: string
  expiresAt: number
  onCancel: () => void
}

export function VMRequestProgress({ vmName, expiresAt, onCancel }: VMRequestProgressProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)

  // 60초 카운트다운 타이머
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000))
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        setRemainingSeconds(0)
      }
    }

    // 즉시 실행
    updateTimer()

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // 프로그레스 계산 (30초 기준, 퍼센트로 변환)
  const progress = (remainingSeconds / 30) * 100

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">{vmName} 요청 중</span>
        <Progress value={progress} className="h-1.5 w-32 bg-blue-100" />
        <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">{remainingSeconds}s</span>
        <Button size="sm" variant="outline" onClick={onCancel} className="">
          취소
        </Button>
      </div>
    </div>
  )
}
