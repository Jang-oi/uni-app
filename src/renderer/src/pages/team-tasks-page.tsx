import { useEffect, useState } from 'react'
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { api, ApiResponse } from '@shared/api/client'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TaskDisplayData, useTaskStore } from '@/stores/task'

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return { isTruncated: false, displayText: text || '' }
  return { isTruncated: true, displayText: text.slice(0, maxLength) + '...' }
}

export function TeamTasksPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)
  const initSocket = useTaskStore((state) => state.initSocket)

  const [sorting, setSorting] = useState<SortingState>([])

  // Socket.io 연결 및 리스너 가동
  useEffect(() => {
    initSocket()
  }, [initSocket])

  // 서버에서 업무 데이터 조회 (초기 로딩)
  useEffect(() => {
    const fetchTasks = async () => {
      const response = await api.get<ApiResponse>('/api/tasks/team')
      console.log(response)
      if (response.data.success && response.data.data) {
        setTasks(response.data.data as TaskDisplayData[])
      }
    }
    fetchTasks()
  }, [setTasks])

  const columns: ColumnDef<TaskDisplayData>[] = [
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
      accessorKey: 'STATUS',
      header: '상태',
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('STATUS')}</div>
    },
    {
      accessorKey: 'REQ_DATE_ALL',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            요청일
            <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('REQ_DATE_ALL')}</div>
    }
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting }
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
