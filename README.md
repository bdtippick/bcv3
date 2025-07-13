# 배달 라이더 정산 시스템

배달 플랫폼 라이더 정산을 관리하는 Next.js 기반 웹 애플리케이션입니다.

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (Database, Authentication)
- **State Management**: TanStack Query (React Query)

## 📋 주요 기능

- ✅ 사용자 인증 (회원가입, 로그인, 로그아웃)
- ✅ 다이나믹 헤더 (로그인 상태에 따른 UI 변경)
- ✅ 보호된 대시보드 경로
- ✅ 사용자 프로필 관리
- ✅ 멀티 테넌트 지원 (회사/지점 구조)
- ✅ Row Level Security (RLS) 적용

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 페이지
│   ├── dashboard/         # 대시보드 페이지
│   └── api/               # API 라우트
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── lib/                   # 라이브러리 및 유틸리티
│   └── supabase/          # Supabase 클라이언트
├── types/                 # TypeScript 타입 정의
├── providers/             # React Context 프로바이더
└── hooks/                 # 커스텀 훅
```

## 🛠️ 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경변수 설정**
   `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **데이터베이스 설정**
   - Supabase 프로젝트 생성
   - `database-fixed.sql` 파일의 스키마를 Supabase SQL Editor에서 실행
   - `supabase-auth-trigger.sql` 파일의 트리거를 실행

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

## 🗄️ 데이터베이스 스키마

### 주요 테이블
- `companies`: 회사 정보 (최상위 테넌트)
- `branches`: 지점 정보
- `user_profiles`: 사용자 프로필 (Supabase Auth와 연동)
- `riders`: 라이더 정보
- `settlement_records`: 정산 기록

### 사용자 역할
- `super_admin`: 슈퍼 관리자
- `company_admin`: 회사 관리자
- `branch_manager`: 지점 관리자
- `user`: 일반 사용자

## 🔐 인증 및 보안

- Supabase Authentication 사용
- JWT 기반 세션 관리
- Row Level Security (RLS) 적용
- 미들웨어를 통한 라우트 보호

## 📝 개발 가이드

### 새로운 컴포넌트 추가
```bash
# shadcn/ui 컴포넌트 추가
npx shadcn@latest add [component-name]
```

### 타입 정의 업데이트
Supabase 스키마 변경 시 타입 정의를 업데이트하세요:
```bash
npx supabase gen types typescript --project-id [project-id] > src/types/supabase.ts
```

## 🚀 배포

Vercel에 배포하기 위해서는:
1. GitHub 리포지토리를 Vercel에 연결
2. 환경변수 설정
3. 자동 배포 완료

## 📄 라이선스

MIT License

## 🤝 기여

프로젝트 개선을 위한 Pull Request를 환영합니다.

---

**개발**: Claude Code AI Assistant  
**생성일**: 2025년 1월 12일