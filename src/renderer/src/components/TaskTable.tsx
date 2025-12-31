import { useState } from 'react'
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TaskDisplayData } from '@/stores/task'
import { openUniPost } from '../util/util'

function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return { isTruncated: false, displayText: text || '' }
  return { isTruncated: true, displayText: text.slice(0, maxLength) + '...' }
}

interface TaskTableProps {
  data: TaskDisplayData[]
  onRequestClick?: (task: TaskDisplayData) => void
}

export function TaskTable({ data, onRequestClick }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

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
            onClick={() => openUniPost(row.original.SR_IDX)}
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
    },
    {
      id: 'actions',
      header: '요청',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onRequestClick?.(row.original)
          }}
          className="text-xs h-7"
        >
          요청
        </Button>
      ),
      size: 80
    }
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting }
  })

  return (
    <ScrollArea className="h-[calc(80vh-80px)]">
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
              <TableCell colSpan={data.length} className="h-24 text-center">
                검색 결과가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
