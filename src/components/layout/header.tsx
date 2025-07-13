'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, User, LogOut, Settings, Home, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/providers/auth-provider'

export function Header() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return '슈퍼 관리자'
      case 'company_admin':
        return '회사 관리자'
      case 'branch_manager':
        return '지점 관리자'
      case 'user':
        return '일반 사용자'
      default:
        return '사용자'
    }
  }

  if (loading) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <Building2 className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                배달 라이더 정산 시스템
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* 로딩 스켈레톤 */}
              <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* 로고 */}
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <Building2 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              배달 라이더 정산 시스템
            </span>
          </Link>
        </div>

        {/* 모바일 로고 */}
        <div className="mr-4 flex md:hidden">
          <Link className="flex items-center space-x-2" href="/">
            <Building2 className="h-6 w-6" />
            <span className="font-bold">정산시스템</span>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-1">
            {user && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    홈
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    대시보드
                  </Button>
                </Link>
                {profile?.role === 'company_admin' || profile?.role === 'super_admin' ? (
                  <Link href="/dashboard/branches">
                    <Button variant="ghost" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      지점 관리
                    </Button>
                  </Link>
                ) : null}
                {['branch_manager', 'company_admin', 'super_admin'].includes(profile?.role || '') ? (
                  <Link href="/dashboard/riders">
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      라이더 관리
                    </Button>
                  </Link>
                ) : null}
              </>
            )}
          </nav>

          {/* 인증 관련 버튼/메뉴 */}
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={profile?.name || user.email || ''} />
                      <AvatarFallback>
                        {getUserInitials(profile?.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.name || '사용자'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {profile?.role && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {getRoleDisplayName(profile.role)}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* 회사/지점 정보 */}
                  {profile?.company && (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            소속 정보
                          </p>
                          <p className="text-xs">
                            {profile.company.name}
                          </p>
                          {profile.branch && (
                            <p className="text-xs text-muted-foreground">
                              {profile.branch.name} ({profile.branch.code})
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>내 정보</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {(profile?.role === 'company_admin' || profile?.role === 'super_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/branches" className="w-full">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>지점 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {['branch_manager', 'company_admin', 'super_admin'].includes(profile?.role || '') && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/riders" className="w-full">
                        <Users className="mr-2 h-4 w-4" />
                        <span>라이더 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>설정</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}