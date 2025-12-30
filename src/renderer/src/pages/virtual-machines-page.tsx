import { useState } from 'react'
import { VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '../components/page-header'
import { ScrollArea } from '../components/ui/scroll-area'
import { useHypervStore, type HypervVM } from '../stores/hyperv'

export function VirtualMachinesPage() {
  // 스토어에서 데이터만 가져오기 (Socket은 App.tsx에서 이미 초기화됨)
  const vms = useHypervStore((state) => state.vms)

  const [sorting, setSorting] = useState<SortingState>([])

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
      header: '상태',
      cell: ({ row }) => {
        const isConnected = row.getValue('isConnected') as boolean
        return <div className={`font-medium ${isConnected ? 'text-primary' : 'text-slate-400'}`}>{isConnected ? '활성' : '대기'}</div>
      }
    },
    {
      header: '사용요청',
      cell: ({ row }) => {
        const vm = row.original
        const hasUser = vm.currentUser !== null && vm.currentHostname !== null
        const requestVM = useHypervStore((state) => state.requestVM)

        return (
          <Button
            size="sm"
            disabled={!hasUser}
            onClick={async () => {
              if (hasUser && vm.currentHostname) {
                const myHostname = await window.api.getHostname()
                if (vm.currentHostname === myHostname) {
                  toast.info('현재 사용 중인 VM입니다.')
                  return
                }
                if (!vm.currentHostname) return
                requestVM(vm.vmName, vm.currentHostname)
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
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="가상머신"
        description="팀에서 공용으로 사용하는 Hyper-V 인스턴스의 실시간 점유 상태입니다."
        icon={<HugeiconsIcon icon={VirtualRealityVr01Icon} size={20} />}
      />

      <ScrollArea className="h-[calc(68vh-80px)]">
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
    </div>
  )
}
