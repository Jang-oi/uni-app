import { useEffect, useState } from 'react'
import { Loading03Icon, Search01Icon, VirtualRealityVr01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '../components/page-header'
import { ScrollArea } from '../components/ui/scroll-area'
import { useHypervStore, type HypervVM } from '../stores/hyperv'
import { useSocketStore } from '../stores/socket'

export function VirtualMachinesPage() {
  const vms = useHypervStore((state) => state.vms)
  const socket = useSocketStore((state) => state.socket)
  const activeRequest = useHypervStore((state) => state.activeRequest)
  const cancelVMRequest = useHypervStore((state) => state.cancelVMRequest)

  const [sorting, setSorting] = useState<SortingState>([])
  const [myHostname, setMyHostname] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [connectingVM, setConnectingVM] = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)

  // 내 hostname 가져오기
  useEffect(() => {
    window.api.getHostname().then(setMyHostname)
  }, [])

  // 60초 카운트다운 타이머
  useEffect(() => {
    if (!activeRequest) {
      setRemainingSeconds(0)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((activeRequest.expiresAt - now) / 1000))
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        setRemainingSeconds(0)
      }
    }

    // 즉시 실행
    updateTimer()

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activeRequest])

  // Socket 이벤트 리스너 등록
  useEffect(() => {
    if (!socket) return

    // Lock 상태 처리 (다른 사람이 먼저 요청 중)
    const handleLocked = (data: { vmName: string; firstRequesterName: string }) => {
      toast.error(`이미 ${data.firstRequesterName}님이 요청 중입니다. (60초 동안 Lock)`)
    }

    // 타임아웃 처리
    const handleTimeout = (data: { vmName: string }) => {
      toast.warning(`${data.vmName} 요청이 60초간 응답이 없어 만료되었습니다.`)
    }

    socket.on('vm:request-locked', handleLocked)
    socket.on('vm:timeout', handleTimeout)

    return () => {
      socket.off('vm:request-locked', handleLocked)
      socket.off('vm:timeout', handleTimeout)
    }
  }, [socket])

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
              variant="destructive"
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
            onClick={async () => {
              if (!vm.currentHostname) return
              if (vm.currentHostname === myHostname) {
                toast.success(`본인이 사용중인 VM 입니다.`)
                return
              }
              requestVM(vm.vmName, vm.currentHostname)
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
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters }
  })

  return (
    <div className="p-8 h-full flex flex-col bg-white">
      <PageHeader
        title="HYPER-V"
        description="팀에서 공용으로 사용하는 Hyper-V 인스턴스의 실시간 점유 상태입니다."
        icon={<HugeiconsIcon icon={VirtualRealityVr01Icon} size={20} />}
      />

      {/* VM 요청 카운트다운 UI */}
      {activeRequest && remainingSeconds > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-blue-900">{activeRequest.vmName} 사용 요청 중...</span>
              <span className="text-xs text-blue-700">응답 대기 중 (요청자에게 알림이 전송되었습니다)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="#DBEAFE" strokeWidth="4" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - remainingSeconds / 60)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{remainingSeconds}s</span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => cancelVMRequest(activeRequest.vmName)}>
              요청 취소
            </Button>
          </div>
        </div>
      )}

      {/* 검색 입력 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="VM 이름으로 검색..."
            value={(table.getColumn('vmName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('vmName')?.setFilterValue(event.target.value)}
            className="pl-9"
          />
        </div>
        {(table.getColumn('vmName')?.getFilterValue() as string) && (
          <div className="text-sm text-slate-500">{table.getFilteredRowModel().rows.length}개의 VM 검색됨</div>
        )}
      </div>

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
