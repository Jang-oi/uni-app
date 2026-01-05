import { ReactNode } from 'react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PageHeaderProps {
  title: string
  description: string
  icon: ReactNode
  action?: ReactNode
}

export function PageHeader({ title, description, icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-xl text-primary shrink-0">{icon}</div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HugeiconsIcon icon={InformationCircleIcon} size={16} />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-900 text-white border-none text-xs">
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
