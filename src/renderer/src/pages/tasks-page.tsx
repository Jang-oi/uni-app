import { useEffect, useState } from 'react'
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTaskStore } from '@/stores/task'

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return { isTruncated: false, displayText: text || '' }
  return { isTruncated: true, displayText: text.slice(0, maxLength) + '...' }
}

export function TasksPage() {
  const [activeView, setActiveView] = useState<'team' | 'personal'>('team')
  const [sorting, setSorting] = useState<SortingState>([])

  const teamTasks = useTaskStore((state) => state.teamTasks)
  const memberTasks = useTaskStore((state) => state.memberTasks)
  const currentUser = useTaskStore((state) => state.currentUser)
  const setCurrentUser = useTaskStore((state) => state.setCurrentUser)

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userName = await window.api.getUserName()
        setCurrentUser(userName)
      } catch (error) {
        console.error('[Tasks] 사용자 정보 조회 실패:', error)
        setCurrentUser('알 수 없음')
      }
    }
    fetchUserName()
  }, [])

  // 표시할 데이터 결정
  const personalTasks = memberTasks[currentUser] || []
  const displayTasks = activeView === 'team' ? teamTasks : personalTasks

  const columns = [
    {
      accessorKey: 'CM_NAME',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          고객사
          <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4" />
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
      },
      size: 100
    },
    {
      accessorKey: 'REQ_TITLE',
      header: () => (
        <Button variant="ghost" size="sm" className="h-6 px-1 text-xs font-medium w-full justify-start">
          제목
        </Button>
      ),
      cell: ({ row }) => {
        const { displayText } = truncateText(row.original.REQ_TITLE, 34)
        return (
          <button
            className="text-xs cursor-pointer block leading-tight text-left hover:text-blue-600 hover:underline transition-colors"
            onClick={() => }
          >
            {displayText}
          </button>
        )
      },
      size: 280
    },
    {
      accessorKey: 'STATUS',
      header: '상태',
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('STATUS')}</div>,
      size: 100
    },
    {
      accessorKey: 'REQ_DATE_ALL',
      header: '요청일',
      cell: ({ row }) => <div className="text-slate-500">{row.getValue('REQ_DATE_ALL')}</div>,
      size: 120
    }
  ]

  const table = useReactTable({
    data: displayTasks,
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
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">업무</h1>
        <p className="text-slate-600">팀 업무와 개인 업무를 확인하세요.</p>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'team' | 'personal')}>
        <TabsList>
          <TabsTrigger value="team">팀 전체</TabsTrigger>
          <TabsTrigger value="personal">{currentUser} 매니저</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <ScrollArea className="h-[calc(77vh-80px)]">
            <Table className="w-full border border-slate-200" style={{ tableLayout: 'fixed' }}>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="text-xs font-semibold text-slate-700 uppercase tracking-wide"
                          style={{ width: `${header.getSize()}px` }}
                        >
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
                      onClick={() => console.log(row.original)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3" style={{ width: `${cell.column.getSize()}px` }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={displayTasks.length} className="h-24 text-center">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="personal" className="mt-6">
          <ScrollArea className="h-[calc(77vh-80px)]">
            <Table className="w-full border border-slate-200" style={{ tableLayout: 'fixed' }}>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="text-xs font-semibold text-slate-700 uppercase tracking-wide"
                          style={{ width: `${header.getSize()}px` }}
                        >
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
                      onClick={() => console.log(row.original)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3" style={{ width: `${cell.column.getSize()}px` }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={displayTasks.length} className="h-24 text-center">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
