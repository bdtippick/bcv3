import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Code, FileSpreadsheet } from 'lucide-react'
import { ParserSettingsForm } from '@/components/settings/parser-settings-form'

export default async function ParserSettingsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  const profile = await getCurrentUserProfile()

  // 권한 확인 (branch_manager, company_admin, super_admin)
  const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
  if (!profile || !allowedRoles.includes(profile.role || '')) {
    redirect('/dashboard')
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-3.5rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">파싱 규칙 설정</h1>
              <p className="text-slate-600 mt-1">
                배달 플랫폼별 엑셀 파일 파싱 규칙을 설정합니다
              </p>
            </div>
          </div>
        </div>

        {/* 설정 폼 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              엑셀 파싱 규칙 설정
            </CardTitle>
            <CardDescription>
              배달 플랫폼별로 엑셀 파일의 구조에 맞는 파싱 규칙을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParserSettingsForm userProfile={profile} />
          </CardContent>
        </Card>

        {/* 간단한 사용법 가이드 */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              🚀 빠른 시작 가이드
            </CardTitle>
            <CardDescription>
              처음 사용하시나요? 이렇게 간단하게 시작하세요!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-lg mb-2">1️⃣</div>
                <h4 className="font-semibold text-sm mb-2">플랫폼 선택</h4>
                <p className="text-sm text-gray-600">
                  배민커넥트비즈, 쿠팡이츠플러스 등 사용하는 플랫폼을 선택하세요
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-lg mb-2">2️⃣</div>
                <h4 className="font-semibold text-sm mb-2">템플릿 적용</h4>
                <p className="text-sm text-gray-600">
                  "기본 템플릿 적용" 버튼을 클릭하면 대부분의 설정이 자동으로 완료됩니다
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-lg mb-2">3️⃣</div>
                <h4 className="font-semibold text-sm mb-2">저장 완료</h4>
                <p className="text-sm text-gray-600">
                  "파싱 규칙 저장" 버튼을 클릭하면 설정 완료! 이제 파일을 업로드하세요
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-sm mb-2">💡 꿀팁</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 처음엔 기본 템플릿만 사용해도 충분합니다!</li>
                <li>• 고급 설정은 나중에 필요할 때 수정하세요</li>
                <li>• 설정 후 정산 관리 페이지에서 파일을 업로드해보세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}