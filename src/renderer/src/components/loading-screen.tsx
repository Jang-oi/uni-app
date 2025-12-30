import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

export function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        {/* 로딩 애니메이션 */}
        <motion.div
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center border-2 border-primary/10 shadow-sm mb-6"
        >
          <HugeiconsIcon icon={Loading03Icon} className="w-10 h-10 text-primary" />
        </motion.div>

        {/* 텍스트 및 상태 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">구독4팀 프로그램 시작 중</h2>
          <p className="text-sm text-slate-500 mt-2">잠시만 기다려주세요...</p>
          <div className="flex gap-1 mt-3 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
