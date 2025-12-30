import { Router } from 'express'
import { USER_NAME_MAP} from "@/config/users";
import { vmMaps} from "@/index";

// 타임아웃 설정: 10초 동안 heartbeat 없으면 자동 해제
const HEARTBEAT_TIMEOUT_MS = 10000

// 사용자별 이전 상태 추적 (변경 감지용)
const userPreviousVMs = new Map<string, Set<string>>()

// 사용 중(isConnected: true)인 항목을 상단으로 보냅니다.
const getSortedVMs = () => {
    return Array.from(vmMaps.values())
        .map((vm: any) => ({
            ...vm,
            lastUpdate: vm.lastUpdate instanceof Date ? vm.lastUpdate.toLocaleTimeString() : vm.lastUpdate
        }))
        .sort((a: any, b: any) => {
            if (a.isConnected === b.isConnected) return 0
            return a.isConnected ? -1 : 1 // true가 앞으로 오게 정렬
        })
}

export default (io: any) => {
    const router = Router()

    // 타임아웃 체크: 1분마다 실행 (낮은 빈도로 효율적)
    setInterval(() => {
        const now = new Date()
        let hasChanges = false

        vmMaps.forEach((vm: any, vmName: string) => {
            if (vm.isConnected && vm.lastUpdate instanceof Date) {
                const timeSinceUpdate = now.getTime() - vm.lastUpdate.getTime()

                if (timeSinceUpdate > HEARTBEAT_TIMEOUT_MS) {
                    console.log(`⏰ [자동 해제] ${vmName} (${vm.currentUser}) - ${timeSinceUpdate / 1000}초 동안 heartbeat 없음`)

                    vmMaps.set(vmName, {
                        ...vm,
                        currentUser: null,
                        currentHostname: null,
                        isConnected: false,
                        lastUpdate: now
                    })
                    hasChanges = true
                }
            }
        })

        // 변경사항이 있으면 모든 클라이언트에 알림
        if (hasChanges) {
            io.emit('hyperv:updated', getSortedVMs())
        }
    }, 60000) // 1분마다 체크

    // 새 Heartbeat API: 전체 상태 수신
    router.post('/heartbeat', (req, res) => {
        const { hostname, activeVMs } = req.body as { hostname: string; activeVMs: string[] }

        const actualUserName = USER_NAME_MAP[hostname] || '알 수 없음'

        if (!actualUserName) return res.status(400).json({ success: false, error: 'userName required' })
        const currentVMs = new Set(activeVMs || [])
        const previousVMs = userPreviousVMs.get(actualUserName) || new Set<string>()

        const disconnectedVMs = Array.from(previousVMs).filter((vm) => !currentVMs.has(vm))
        disconnectedVMs.forEach((vm) => {
            console.log(`❌ [해제] ${vm} (${actualUserName})`)
            vmMaps.set(vm, {
                vmName: vm,
                currentUser: null,
                currentHostname: null,
                isConnected: false,
                lastUpdate: new Date()
            })
        })

        activeVMs.forEach((vm) => {
            vmMaps.set(vm, {
                vmName: vm,
                currentUser: actualUserName,
                currentHostname: hostname,
                isConnected: true,
                lastUpdate: new Date()
            })
        })

        userPreviousVMs.set(actualUserName, currentVMs)
        if (disconnectedVMs.length > 0 || activeVMs.length > 0) io.emit('hyperv:updated', getSortedVMs())
        console.log(`[Heartbeat] ${actualUserName}: ${activeVMs.length}개 VM 사용 중`)
        res.json({ success: true })
    })

    return router
}
