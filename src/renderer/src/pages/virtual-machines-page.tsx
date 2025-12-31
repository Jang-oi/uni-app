import { useEffect, useState } from 'react'
import { Loading03Icon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '../components/page-header'
import { ScrollArea } from '../components/ui/scroll-area'
import { useHypervStore, type HypervVM } from '../stores/hyperv'

export function VirtualMachinesPage() {
  const vms = useHypervStore((state) => state.vms)

  const [sorting, setSorting] = useState<SortingState>([])
  const [myHostname, setMyHostname] = useState<string | null>(null)
  const [connectingVM, setConnectingVM] = useState<string | null>(null)

  // 내 hostname 가져오기
  useEffect(() => {
    window.api.getHostname().then(setMyHostname)
  }, [])

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
      header: '작업',
      cell: ({ row }) => {
        const vm = row.original
        const requestVM = useHypervStore((state) => state.requestVM)

        // 비활성 VM (실행하기)
        if (!vm.isConnected && !vm.currentUser) {
          const isConnecting = connectingVM === vm.vmName

          return (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={isConnecting}
              onClick={async () => {
                setConnectingVM(vm.vmName)
                try {
                  const result = await window.api.connectToVM({
                    hostServer: vm.hostServer,
                    vmName: vm.vmName
                  })

                  if (result.success) {
                    toast.success(`${vm.vmName} 연결 완료!`)
                  } else {
                    toast.error(`연결 실패: ${result.error || '알 수 없는 오류'}`)
                  }
                } catch (error) {
                  console.error('[VM Connect] 연결 실패:', error)
                  toast.error('VM 연결에 실패했습니다.')
                } finally {
                  setConnectingVM(null)
                }
              }}
            >
              {isConnecting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 mr-1.5 animate-spin" />
                  연결 중...
                </>
              ) : (
                '실행하기'
              )}
            </Button>
          )
        }
        return (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              if (!vm.currentHostname) return
              if (vm.currentHostname === myHostname) {
                toast.success(`본인이 사용중인 VM 입니다.`)
                return
              }
              requestVM(vm.vmName, vm.currentHostname)
              toast.success(`${vm.vmName} 사용 요청이 전송되었습니다.`)
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
        title="HYPER-V"
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
