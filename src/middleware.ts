import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 현재 경로
  const pathname = request.nextUrl.pathname

  // 정적 파일 및 API 경로는 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return response
  }

  try {
    // 사용자 세션 확인
    const { data: { user }, error } = await supabase.auth.getUser()

    // 보호된 경로 정의 (/dashboard로 시작하는 모든 경로)
    const protectedRoutes = [
      '/dashboard',
      '/settings',
      '/profile',
      // 필요에 따라 추가 보호 경로를 여기에 추가
    ]
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )

    // 인증 관련 경로
    const authRoutes = ['/auth']
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )

    // 보호된 경로에 대한 접근 제어
    if (isProtectedRoute) {
      if (!user || error) {
        console.log(`Redirecting unauthenticated user from ${pathname} to /auth`)
        const redirectUrl = new URL('/auth', request.url)
        // 원래 가려던 페이지를 저장하여 로그인 후 리다이렉트
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // 사용자가 존재하는 경우 프로필 확인 (선택사항)
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // 프로필이 없는 경우 (선택사항: 프로필 설정 페이지로 리다이렉트)
        if (!profile && pathname !== '/dashboard/setup') {
          console.log(`User ${user.id} has no profile, allowing access to dashboard`)
          // 여기서는 프로필이 없어도 대시보드 접근을 허용
          // 필요에 따라 프로필 설정 페이지로 리다이렉트 가능
        }
      } catch (profileError) {
        console.error('Error checking user profile:', profileError)
        // 프로필 확인 실패 시에도 접근 허용 (DB 연결 문제 등)
      }
    }

    // 이미 로그인된 사용자가 인증 페이지에 접근하는 경우
    if (isAuthRoute && user && !error) {
      // redirect 파라미터가 있으면 해당 페이지로, 없으면 대시보드로
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
      console.log(`Redirecting authenticated user from ${pathname} to ${redirectTo}`)
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

  } catch (authError) {
    console.error('Auth middleware error:', authError)
    
    // 인증 확인 중 오류가 발생한 경우
    if (pathname.startsWith('/dashboard')) {
      // 보호된 경로에서 오류 발생 시 인증 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    
    // 다른 경로에서는 계속 진행
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}