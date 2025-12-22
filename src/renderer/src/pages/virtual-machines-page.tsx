import * as React from 'react'
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '../components/ui/scroll-area'
import { useHypervStore, type HypervVM } from '../stores/hyperv'

export function VirtualMachinesPage() {
  const { vms, initSocket } = useHypervStore()

  React.useEffect(() => {
    initSocket() // 소켓 연결 및 리스너 가동
  }, [])

  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<HypervVM>[] = [
    {
      accessorKey: 'vmName',
      header: 'VM 이름',
      cell: ({ row }) => <div className="font-medium">{row.getValue('vmName')}</div>
    },
    {
      accessorKey: 'currentUser',
      header: '현재 사용자',
      cell: ({ row }) => {
        const user = row.getValue('currentUser') as string | null
        return user ? <div className="text-slate-700">{user}</div> : <div className="text-slate-400 text-sm">-</div>
      }
    },
    {
      accessorKey: 'isConnected',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            상태
            <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isConnected = row.getValue('isConnected') as boolean
        return <div className={`font-medium ${isConnected ? 'text-green-600' : 'text-slate-400'}`}>{isConnected ? '활성' : '대기'}</div>
      }
    },
    {
      header: '사용요청',
      cell: ({ row }) => {
        const vm = row.original
        const hasUser = vm.currentUser !== null

        return (
          <Button
            size="sm"
            disabled={!hasUser}
            onClick={() => {
              if (hasUser) {
                console.log('[VM Request]:', vm.vmName)
                toast.success(`${vm.vmName} 사용 요청이 전송되었습니다.`)
              }
            }}
          >
            요청하기
          </Button>
        )
      }
    }
  ]

  const table = useReactTable({
    data: vms,
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
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">가상머신</h1>
        <p className="text-slate-600">HYPER-V 의 사용 현황을 확인하세요.</p>
      </div>
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="VM 이름으로 검색..."
          value={(table.getColumn('vmName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('vmName')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
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
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
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
