import { ArtificialIntelligence01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

export function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        {/* 귀여운 로봇 애니메이션 */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center border-2 border-primary/10 shadow-sm mb-6"
        >
          <HugeiconsIcon icon={ArtificialIntelligence01Icon} className="w-12 h-12 text-primary" />
        </motion.div>

        {/* 텍스트 및 상태 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI 비서가 준비 중이에요</h2>
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
