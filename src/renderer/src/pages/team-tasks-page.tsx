import { useEffect, useState } from 'react'
import { AlertCircleIcon, ArrowUpDownIcon, CircleIcon, Clock01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { api, ApiResponse } from '@shared/api/client'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTaskStore, type Task } from '@/stores/task'

const priorityConfig = {
  high: { icon: AlertCircleIcon, color: 'text-red-600', label: '높음' },
  medium: { icon: Clock01Icon, color: 'text-orange-500', label: '중간' },
  low: { icon: CircleIcon, color: 'text-slate-400', label: '낮음' }
}

const statusConfig = {
  pending: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '신규' },
  'in-progress': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600', label: '진행중' },
  completed: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: '완료' }
}

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return { isTruncated: false, displayText: text || '' }
  return { isTruncated: true, displayText: text.slice(0, maxLength) + '...' }
}

export function TeamTasksPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // 서버에서 업무 데이터 조회
  useEffect(() => {
    const fetchTasks = async () => {
      const response = await api.get<ApiResponse>('/api/tasks')
      if (response.data.success && response.data.data) {
        // TODO: 개인 업무 필터링 로직 추가 (현재 사용자 기준)
        setTasks(response.data.data as Task[])
      }
    }
    fetchTasks()
  }, [setTasks])

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'priority',
      header: '우선순위',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as keyof typeof priorityConfig
        const priorityIcon = priorityConfig[priority].icon
        return <HugeiconsIcon icon={priorityIcon} className={`w-4 h-4 ${priorityConfig[priority].color}`} />
      }
    },
    {
      accessorKey: 'CM_NAME',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-xs font-medium w-full justify-start"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          고객사
        </Button>
      ),
      cell: ({ row }) => {
        const { displayText, isTruncated } = truncateText(row.original.CM_NAME, 8)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-[11px] font-medium cursor-default block">{displayText}</span>
              </TooltipTrigger>
              {isTruncated && (
                <TooltipContent>
                  <p>{row.original.CM_NAME}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      }
    },
    {
      accessorKey: 'assignee',
      header: '담당자',
      cell: ({ row }) => <div className="text-slate-600">{row.getValue('assignee')}</div>
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof statusConfig
        const config = statusConfig[status] || statusConfig.pending
        return (
          <Badge className={`${config.bg} ${config.text} ${config.border}`} variant="outline">
            {config.label}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            마감일
            <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('dueDate')}</div>
    }
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">팀 업무</h1>
        <p className="text-slate-600">4팀 업무를 확인하세요.</p>
      </div>

      <ScrollArea className="h-[calc(64vh-80px)]">
        <Table className="w-full border border-slate-200" style={{ tableLayout: 'fixed' }}>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => console.log(1)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </motion.div>
  )
}
