import { randomUUID } from 'crypto'
import { createServer } from 'http'
import cors from 'cors'
import express from 'express'
import { Server } from 'socket.io'
import hypervRouter from './routes/hyperv.js'
import notificationRouter from './routes/notification.js'
import userRouter from './routes/user.js'
import { runInitialTaskCrawling, startTaskScheduler } from './schedulers/taskScheduler.js'
import { runInitialVacationCrawling, startVacationScheduler } from './schedulers/vacationScheduler.js'
import 'dotenv/config'
import { ProcessedEvent } from '@/types/calendar'
import { Notification } from '@/types/notification'
import { TaskDisplayData } from '@/types/task'
import { NAME_TO_HOSTNAME_MAP, USER_NAME_MAP } from './config/users.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 전역 데이터 저장소
export const vmMaps = new Map()
const clientMap = new Map()
// Task 전역 저장소
export const taskData: {
  team: TaskDisplayData[]
  members: Record<string, TaskDisplayData[]>
  lastUpdated: string | null
} = {
  team: [],
  members: {},
  lastUpdated: ''
}

// Vacation 전역 저장소
export const calendarData: {
  vacationsDate: ProcessedEvent[]
} = {
  vacationsDate: []
}

// Notification 전역 저장소
export const notificationData: {
  notifications: Notification[]
} = {
  notifications: []
}

export let socketIO: Server
// 라우터 등록
app.use('/api/hyperv', hypervRouter(io))
app.use('/api/notification', notificationRouter())
app.use('/api/user', userRouter())

io.on('connection', (socket) => {
  // Hyperv 초기 데이터 전송
  socket.emit('hyperv:updated', Array.from(vmMaps.values()))
  // Calendar 초기 데이터 전송
  socket.emit('calendar:updated', calendarData)
  // Task 초기 데이터 전송
  socket.emit('task:updated', taskData)

  // 연결 시 userName(hostname) 수신
  socket.on('register:user', (data) => {
    const { hostname } = data
    socket.join(hostname)

    // 본인에게 온 알림만 필터링하여 전송
    const userNotifications = notificationData.notifications.filter((n) => n.receiverHostname === hostname)
    socket.emit('notification:initial', userNotifications)

    console.log(`[Socket] ${hostname} 등록 및 room 참여`)
  })

  socket.on('vm:request', (data) => {
    const { vmName, requestedByHostname, currentHostname } = data

    // hostname → 사용자 이름 변환
    const requestedByName = USER_NAME_MAP[requestedByHostname] || '알 수 없음'
    const currentUserName = USER_NAME_MAP[currentHostname] || '알 수 없음'

    console.log(`[VM Request] ${requestedByName}가 ${vmName} 사용 요청 (현재 사용자: ${currentUserName})`)

    // 통합 알림 생성
    const notification: Notification = {
      id: randomUUID(),
      type: 'vm-request',
      senderHostname: requestedByHostname,
      senderName: requestedByName,
      receiverHostname: currentHostname,
      receiverName: currentUserName,
      message: `${requestedByName}님이 ${vmName} 사용을 요청했습니다.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      vmName
    }

    // 전역 저장소에 추가
    notificationData.notifications.push(notification)

    // 수신자에게만 알림 전송 (통합 알림 시스템 사용)
    io.to(currentHostname).emit('notification:new', notification)

    console.log(`[VM Notification] ${currentUserName} (${currentHostname})에게 알림 전송 완료`)
  })

  // 업무 요청 알림 전송
  socket.on('task:request', (data) => {
    const { taskId, taskTitle, senderHostname, receiverName, type } = data

    // 수신자 이름 → hostname 변환
    const receiverHostname = NAME_TO_HOSTNAME_MAP[receiverName]
    if (!receiverHostname) {
      console.error(`[Task Request] 수신자 이름 "${receiverName}"에 해당하는 hostname을 찾을 수 없습니다.`)
      return
    }

    // hostname → 사용자 이름 변환
    const senderName = USER_NAME_MAP[senderHostname] || '알 수 없음'

    // 알림 생성
    const notification: Notification = {
      id: randomUUID(),
      type,
      taskId,
      taskTitle,
      senderHostname,
      senderName,
      receiverHostname,
      receiverName,
      message:
        type === 'task-check'
          ? `${senderName}님이 "${taskTitle}" 업무 확인을 요청했습니다.`
          : `${senderName}님이 "${taskTitle}" 업무 지원을 요청했습니다.`,
      timestamp: new Date().toISOString(),
      isRead: false
    }

    // 전역 저장소에 추가
    notificationData.notifications.push(notification)

    // 수신자에게만 알림 전송
    io.to(receiverHostname).emit('notification:new', notification)

    console.log(`[Task Request] ${senderName} → ${receiverName} (${receiverHostname}): ${notification.message}`)
  })

  // 알림 읽음 처리
  socket.on('notification:read', (data) => {
    const { notificationId, hostname } = data

    const notification = notificationData.notifications.find((n) => n.id === notificationId)
    if (notification && notification.receiverHostname === hostname) {
      notification.isRead = true

      // 모든 클라이언트에게 업데이트 전송 (동기화)
      io.emit('notification:updated', notification)

      console.log(`[Notification] ${notificationId} 읽음 처리 완료`)
    }
  })

  // 전체 읽음 처리
  socket.on('notification:read-all', (data) => {
    const { hostname } = data

    const userNotifications = notificationData.notifications.filter((n) => n.receiverHostname === hostname && !n.isRead)

    userNotifications.forEach((n) => {
      n.isRead = true
    })

    // 업데이트된 알림 목록 전송
    io.to(hostname).emit('notification:all-read', userNotifications)

    console.log(`[Notification] ${hostname} 전체 읽음 처리 완료 (${userNotifications.length}건)`)
  })
})

socketIO = io

const PORT = 3000
httpServer.listen(PORT, '0.0.0.0', async () => {
  try {
    console.log('[Init] Vacation 크롤링 초기화 중...')
    await runInitialVacationCrawling()

    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('[Init] Task 크롤링 초기화 중...')
    await runInitialTaskCrawling()

    startTaskScheduler()
    startVacationScheduler()
  } catch (error) {
    console.error('[Init] 초기 데이터 동기화 중 에러:', error)
  }
})
