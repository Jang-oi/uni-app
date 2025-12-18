# uni-app 구현 가이드 (Electron-Vite 관점)

> 4team 대시보드 시스템을 Electron-Vite로 구현하기 위한 Phase별 실행 가이드

## 현재 상태

**진행률**: ~25% (UI 레이아웃 완료, 데이터 연동 미완)

✅ **완료**
- Electron-Vite 기본 구조
- React + TypeScript + Tailwind
- UI 컴포넌트 (shadcn/ui)
- 4개 페이지 레이아웃

❌ **미완**
- Electron 메인 프로세스 확장
- Socket.io 연동
- 상태 관리
- Express 서버

---

## Phase 1: Electron 메인 프로세스 구조 (Master/Client 모드)

### 📁 디렉토리 구조
```
src/main/
├── index.ts              # 진입점 (현재 기본만 존재)
├── window.ts             # 윈도우 관리
├── config.ts             # 환경 설정 로드
├── ipc/                  # IPC 핸들러
│   ├── crawler.ts        # 크롤러 제어
│   └── settings.ts       # 설정 저장/로드
├── socket/               # Socket.io 클라이언트
│   └── client.ts
├── crawler/ (Master only)
│   ├── scheduler.ts      # node-cron
│   ├── browser.ts        # BrowserWindow 크롤링
│   ├── vacation.ts
│   └── task.ts
└── hyperv/ (모든 앱)
    ├── monitor.ts        # PowerShell 모니터
    └── request.ts
```

### 🔧 필요 패키지
```bash
pnpm add socket.io-client node-cron
pnpm add -D @types/node-cron
```

### 📝 환경 설정 (.env)
```env
# 앱 모드 (Master = 크롤러 포함)
APP_MODE=client  # client | master

# 서버 연결
SERVER_URL=http://192.168.x.x:3000

# Master 전용
VACATION_SITE_URL=https://vacation.company.com
TASK_SITE_URL=https://task.company.com
TEAM_MEMBERS=홍길동,김철수,이영희
```

### 구현 핵심
**main/index.ts**
```typescript
const isMaster = process.env.APP_MODE === 'master'

app.whenReady().then(() => {
  createWindow()
  socketClient.connect()
  hypervMonitor.start()

  if (isMaster) {
    crawlerScheduler.start()  // Master만 크롤러 실행
  }
})
```

---

## Phase 2: Socket.io 클라이언트 (양방향 통신)

### 📁 파일
```
src/main/socket/client.ts
```

### 구현 핵심
```typescript
import { io } from 'socket.io-client'

class SocketClient {
  socket = io(process.env.SERVER_URL)

  connect() {
    this.socket.on('connect', () => {
      this.socket.emit('client:connect', {
        hostname: os.hostname()
      })
    })

    // 이벤트 리스너
    this.socket.on('vacation:updated', (data) => {
      mainWindow?.webContents.send('vacation:updated', data)
    })

    this.socket.on('task:updated', (data) => {
      mainWindow?.webContents.send('task:updated', data)
    })
  }
}
```

### Renderer ↔ Main IPC
```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('electron', {
  onVacationUpdated: (callback) => ipcRenderer.on('vacation:updated', callback),
  onTaskUpdated: (callback) => ipcRenderer.on('task:updated', callback)
})
```

---

## Phase 3: 크롤러 모듈 (Master 전용)

### 📁 파일
```
src/main/crawler/
├── scheduler.ts
├── browser.ts
├── vacation.ts
└── task.ts
```

### 구현 핵심

**scheduler.ts**
```typescript
import cron from 'node-cron'

class CrawlerScheduler {
  start() {
    // 휴가: 09시, 12시, 18시
    cron.schedule('0 9,12,18 * * *', () => {
      vacationCrawler.crawl()
    })

    // 업무: 매 1분
    cron.schedule('* * * * *', () => {
      taskCrawler.crawl()
    })
  }
}
```

**browser.ts (BrowserWindow 크롤링)**
```typescript
class CrawlerBrowser {
  window: BrowserWindow

  async init() {
    this.window = new BrowserWindow({
      show: false,  // 숨김 모드
      webPreferences: { contextIsolation: true }
    })
  }

  async navigateTo(url: string) {
    await this.window.loadURL(url)
  }

  async executeScript<T>(script: string): Promise<T> {
    return await this.window.webContents.executeJavaScript(script)
  }
}
```

**vacation.ts**
```typescript
class VacationCrawler {
  async crawl() {
    await browser.navigateTo(process.env.VACATION_SITE_URL)

    // 로그인 체크
    const isLoggedIn = await this.checkLogin()
    if (!isLoggedIn) return

    // 데이터 파싱
    const vacations = await this.parseVacations()

    // 서버 전송
    await fetch(`${process.env.SERVER_URL}/api/vacations/sync`, {
      method: 'POST',
      body: JSON.stringify({ vacations })
    })
  }

  private async parseVacations() {
    return await browser.executeScript(`
      Array.from(document.querySelectorAll('.vacation-item')).map(el => ({
        employeeName: el.querySelector('.name').textContent,
        startDate: el.querySelector('.start-date').textContent,
        endDate: el.querySelector('.end-date').textContent
      }))
    `)
  }
}
```

---

## Phase 4: HyperV 모니터 (모든 앱)

### 📁 파일
```
src/main/hyperv/
├── monitor.ts
└── request.ts
```

### 구현 핵심

**monitor.ts**
```typescript
import { exec } from 'child_process'

class HypervMonitor {
  start() {
    setInterval(() => this.checkAndReport(), 5000)
  }

  private async checkAndReport() {
    const isConnected = await this.checkConnection()
    const vmName = isConnected ? await this.getVmName() : null

    socketClient.emit('hyperv:update', {
      hostname: os.hostname(),
      vmName,
      isConnected
    })
  }

  private checkConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('netstat -ano | findstr 2179', (err, stdout) => {
        resolve(stdout.trim().length > 0)
      })
    })
  }

  private getVmName(): Promise<string | null> {
    return new Promise((resolve) => {
      exec('powershell "Get-Process vmconnect | % { $_.MainWindowTitle }"', (err, stdout) => {
        const title = stdout.trim()
        const vmName = title.split(' - ')[0]
        resolve(vmName || null)
      })
    })
  }
}
```

---

## Phase 5: 상태 관리 (Zustand)

### 📁 파일
```
src/renderer/src/stores/
├── vacation.ts
├── task.ts
└── hyperv.ts
```

### 🔧 패키지
```bash
pnpm add zustand
```

### 구현 핵심

**stores/task.ts**
```typescript
import { create } from 'zustand'

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks })
}))

// Socket 리스너 설정
window.electron.onTaskUpdated((_, data) => {
  useTaskStore.getState().setTasks(data.tasks)
})
```

**pages/tasks-page.tsx**
```typescript
import { useTaskStore } from '@/stores/task'

export function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks)  // 실시간 데이터

  return <Table data={tasks} />
}
```

---

## Phase 6: Express 서버 (별도 프로젝트)

### 📁 디렉토리
```
team-dashboard-server/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── vacations.ts
│   │   ├── tasks.ts
│   │   └── hyperv.ts
│   └── socket/
│       └── index.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

### 🔧 패키지
```bash
pnpm init
pnpm add express socket.io @prisma/client cors
pnpm add -D typescript @types/express @types/node prisma
```

### 구현 핵심

**index.ts**
```typescript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(express.json())

// 라우트
app.post('/api/vacations/sync', async (req, res) => {
  const { vacations } = req.body

  // DB 저장 (Prisma)
  await prisma.vacation.deleteMany()
  await prisma.vacation.createMany({ data: vacations })

  // 전체 클라이언트에 브로드캐스트
  io.emit('vacation:updated', { vacations })

  res.json({ success: true })
})

// Socket.io
io.on('connection', (socket) => {
  socket.on('hyperv:update', async (data) => {
    // DB 업데이트
    await prisma.hypervStatus.upsert({ ... })

    // 전체 현황 브로드캐스트
    const allStatus = await prisma.hypervStatus.findMany()
    io.emit('hyperv:status', allStatus)
  })
})

server.listen(3000)
```

**prisma/schema.prisma**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Vacation {
  id           Int      @id @default(autoincrement())
  employeeName String
  startDate    DateTime
  endDate      DateTime
  type         String
}

model Task {
  id       Int    @id @default(autoincrement())
  taskId   String @unique
  title    String
  assignee String
  status   String
}

model HypervStatus {
  id           Int      @id @default(autoincrement())
  vmName       String   @unique
  currentUser  String?
  userHostname String?
  isConnected  Boolean
}
```

---

## 실행 순서

### 1단계: 환경 설정
```bash
# Electron App
cd uni-app
cp .env.example .env
# .env 수정: APP_MODE, SERVER_URL 설정

# Server
cd team-dashboard-server
cp .env.example .env
# DATABASE_URL 설정
npx prisma generate
npx prisma migrate dev
```

### 2단계: 서버 시작
```bash
cd team-dashboard-server
pnpm dev  # http://localhost:3000
```

### 3단계: Electron App 시작
```bash
# Client 모드 (일반 팀원)
cd uni-app
APP_MODE=client pnpm dev

# Master 모드 (크롤러 포함)
APP_MODE=master pnpm dev
```

---

## 다음 단계 체크리스트

### Phase 1-2 (기초)
- [ ] .env 설정 파일 생성
- [ ] Socket.io 클라이언트 구현
- [ ] IPC 통신 설정 (preload)
- [ ] Zustand 상태 관리

### Phase 3-4 (고급)
- [ ] 크롤러 스케줄러 (Master)
- [ ] BrowserWindow 크롤링
- [ ] HyperV 모니터 (PowerShell)
- [ ] 알림 시스템

### Phase 5-6 (백엔드)
- [ ] Express 서버 생성
- [ ] Prisma + SQLite 설정
- [ ] Socket.io 서버
- [ ] REST API 구현

---

## 주요 명령어

```bash
# 개발 모드
pnpm dev

# 빌드
pnpm build

# Prettier 포맷팅
npx prettier --write "src/**/*.{ts,tsx}"

# Electron 빌드 (배포용)
pnpm build:win
```

---

## 참고 사항

1. **Master vs Client 모드**
   - Master: 크롤러 실행 (내 PC만)
   - Client: 데이터 조회/알림만 (팀원 PC)

2. **크롤링 대상**
   - 휴가 사이트 (09시, 12시, 18시)
   - 업무 사이트 (매 1분)

3. **HyperV 감지**
   - Port 2179 체크 (netstat)
   - vmconnect 프로세스 확인 (PowerShell)

4. **보안**
   - 자격증명은 Electron Store에 암호화 저장
   - 세션은 BrowserWindow가 자동 관리
