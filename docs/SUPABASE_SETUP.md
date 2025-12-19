# Supabase 설정 가이드

## 개요

uni-app은 Supabase를 데이터베이스로 사용하여 휴가/업무 데이터를 저장하고 조회합니다.

---

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/)에 접속하여 로그인
2. "New Project" 버튼 클릭
3. 프로젝트 정보 입력:
   - **Project Name**: `uni-app` (원하는 이름)
   - **Database Password**: 안전한 비밀번호 설정 (잘 보관하세요!)
   - **Region**: `Northeast Asia (Seoul)` 권장

---

## 2. 환경 변수 설정

Supabase 프로젝트 생성 후, 아래 정보를 확인하여 `.env` 파일에 추가하세요.

### 프로젝트 정보 확인 방법

1. Supabase 대시보드 → **Settings** → **API**
2. 아래 값을 복사:
   - **Project URL**: `SUPABASE_URL`
   - **anon public** 키: `SUPABASE_ANON_KEY`

### .env 파일 예시

```env
# Supabase 연결
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. 데이터베이스 테이블 생성

Supabase SQL Editor에서 아래 SQL 스크립트를 실행하세요.

### 접속 방법

1. Supabase 대시보드 → **SQL Editor**
2. "+ New query" 클릭
3. 아래 SQL 코드 복사 → 붙여넣기 → "Run" 버튼 클릭

---

### vacations 테이블 생성

```sql
-- 휴가 데이터 테이블
CREATE TABLE vacations (
  -- 기본 식별자
  use_id VARCHAR(50) PRIMARY KEY,
  belong_year VARCHAR(4) NOT NULL,

  -- 사용자 정보
  us_id VARCHAR(50) NOT NULL,
  emp_no VARCHAR(20) NOT NULL,
  us_name VARCHAR(50) NOT NULL,
  dept_name VARCHAR(100) NOT NULL,

  -- 휴가 타입 정보
  item_id VARCHAR(50) NOT NULL,
  item_name VARCHAR(50) NOT NULL,
  item_type VARCHAR(10) NOT NULL,

  -- 휴가 기간
  use_sdate DATE NOT NULL,
  use_edate DATE NOT NULL,
  use_stime VARCHAR(2),
  use_etime VARCHAR(2),

  -- 휴가 사용량
  use_min VARCHAR(10),
  use_day_cnt VARCHAR(10) NOT NULL,

  -- 시간 타입 정보
  use_time_type VARCHAR(10),
  use_time_type_name VARCHAR(20),
  time_unit VARCHAR(10),

  -- 승인 정보
  aprv_doc_sts VARCHAR(1) NOT NULL,
  proc_sts VARCHAR(1) NOT NULL,
  aprv_title TEXT,
  last_aprv_us_name VARCHAR(50),
  last_aprv_date VARCHAR(20),

  -- 설명
  use_desc TEXT,

  -- 메타 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_vacations_use_date ON vacations(use_sdate, use_edate);
CREATE INDEX idx_vacations_user ON vacations(us_id, us_name);
CREATE INDEX idx_vacations_dept ON vacations(dept_name);
CREATE INDEX idx_vacations_year ON vacations(belong_year);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vacations_updated_at
  BEFORE UPDATE ON vacations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### tasks 테이블 생성

```sql
-- 업무 데이터 테이블
CREATE TABLE tasks (
  task_id VARCHAR(50) PRIMARY KEY,
  us_id VARCHAR(50) NOT NULL,
  us_name VARCHAR(50) NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(20),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_tasks_user ON tasks(us_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. RLS (Row Level Security) 설정 (선택 사항)

Supabase는 기본적으로 RLS가 활성화되어 있습니다. 개발 환경에서는 RLS를 비활성화하거나, 아래 정책을 추가하세요.

### 모든 사용자에게 읽기/쓰기 허용 (개발용)

```sql
-- vacations 테이블 RLS 정책
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for vacations"
ON vacations FOR ALL
USING (true)
WITH CHECK (true);

-- tasks 테이블 RLS 정책
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for tasks"
ON tasks FOR ALL
USING (true)
WITH CHECK (true);
```

**주의**: 프로덕션 환경에서는 반드시 적절한 RLS 정책을 설정하세요!

---

## 5. 테이블 확인

SQL Editor에서 아래 쿼리로 테이블 생성을 확인하세요:

```sql
-- 테이블 목록 조회
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- vacations 테이블 구조 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vacations';

-- tasks 테이블 구조 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks';
```

---

## 6. 앱 실행

테이블 생성 완료 후, uni-app을 실행하세요:

```bash
pnpm dev
```

---

## 데이터 흐름

1. **크롤러 실행** → 휴가/업무 사이트에서 데이터 수집
2. **Supabase 저장** → `vacations`, `tasks` 테이블에 UPSERT
3. **화면 조회** → Supabase에서 데이터 읽어와서 표시

---

## 문제 해결

### 연결 오류

- `.env` 파일의 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 권한 오류

- RLS 정책 확인 (위의 "모든 접근 허용" 정책 추가)
- `anon` 키가 아닌 `service_role` 키를 사용하지 않았는지 확인

### 테이블이 없음

- SQL Editor에서 테이블 생성 스크립트가 정상 실행되었는지 확인
- `public` 스키마에 테이블이 생성되었는지 확인

---

## 참고

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
