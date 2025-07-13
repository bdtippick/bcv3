import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Building2, MapPin } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  const profile = await getCurrentUserProfile()

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-3.5rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">대시보드</h1>
          <p className="text-slate-600 mt-1">
            안녕하세요, {profile?.name || user.email}님!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 사용자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-600">이메일:</span>
                <p className="text-sm">{user.email}</p>
              </div>
              {profile?.name && (
                <div>
                  <span className="text-sm font-medium text-slate-600">이름:</span>
                  <p className="text-sm">{profile.name}</p>
                </div>
              )}
              {profile?.role && (
                <div>
                  <span className="text-sm font-medium text-slate-600">역할:</span>
                  <p className="text-sm">
                    {profile.role === 'super_admin' && '슈퍼 관리자'}
                    {profile.role === 'company_admin' && '회사 관리자'}
                    {profile.role === 'branch_manager' && '지점 관리자'}
                    {profile.role === 'user' && '일반 사용자'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 회사 정보 */}
          {profile?.company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  소속 회사
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-600">회사명:</span>
                  <p className="text-sm">{profile.company.name}</p>
                </div>
                {profile.company.business_number && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">사업자번호:</span>
                    <p className="text-sm">{profile.company.business_number}</p>
                  </div>
                )}
                {profile.company.phone && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">연락처:</span>
                    <p className="text-sm">{profile.company.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 지점 정보 */}
          {profile?.branch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  소속 지점
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-600">지점명:</span>
                  <p className="text-sm">{profile.branch.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">지점코드:</span>
                  <p className="text-sm">{profile.branch.code}</p>
                </div>
                {profile.branch.manager_name && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">관리자:</span>
                    <p className="text-sm">{profile.branch.manager_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-slate-600">상태:</span>
                  <p className="text-sm">
                    {profile.branch.status === 'active' ? '운영중' : '중지'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 프로필이 없는 경우 안내 */}
        {!profile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>프로필 설정 필요</CardTitle>
              <CardDescription>
                시스템을 사용하기 위해 관리자에게 프로필 설정을 요청하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                현재 계정에 프로필이 설정되어 있지 않습니다. 
                관리자에게 연락하여 회사 및 지점 정보를 설정해주세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}