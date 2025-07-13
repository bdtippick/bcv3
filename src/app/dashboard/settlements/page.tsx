import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, FileSpreadsheet, Upload } from 'lucide-react'
import { SettlementFileUpload } from '@/components/settlements/settlement-file-upload'

export default async function SettlementsPage() {
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
            <Calculator className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">정산 관리</h1>
              <p className="text-slate-600 mt-1">
                {profile.role === 'branch_manager' ? 
                  `${profile.branch?.name || '소속 지점'}의 정산을 관리합니다` :
                  `${profile.company?.name || '소속 회사'}의 모든 정산을 관리합니다`
                }
              </p>
            </div>
          </div>
        </div>

        {/* 정산 파일 업로드 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 파일 업로드 카드 */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                📁 정산 파일 업로드
              </CardTitle>
              <CardDescription>
                엑셀 파일을 업로드하면 자동으로 파싱되어 정산 데이터가 생성됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettlementFileUpload />
            </CardContent>
          </Card>

          {/* 업로드 가이드 카드 */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                📝 사용법 가이드
              </CardTitle>
              <CardDescription>
                정산 파일을 처음 업로드하시나요?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm mb-3 flex items-center">
                  🚀 빠른 시작 3단계
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="text-sm font-medium">파싱 규칙 설정</p>
                      <p className="text-xs text-gray-600">파싱 설정 페이지에서 플랫폼별 규칙을 먼저 설정하세요</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="text-sm font-medium">엑셀 파일 업로드</p>
                      <p className="text-xs text-gray-600">왼쪽 영역에 파일을 드래그하거나 클릭하여 선택하세요</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="text-sm font-medium">자동 처리 완료</p>
                      <p className="text-xs text-gray-600">업로드가 완료되면 자동으로 데이터가 파싱되어 저장됩니다</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">📋 지원 파일</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Excel 파일 (.xlsx, .xls)</li>
                  <li>• 최대 10MB</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">💡 첫 번째 업로드인가요?</h4>
                <p className="text-xs text-gray-600">
                  먼저 "파싱 설정" 메뉴에서 사용하는 플랫폼의 규칙을 설정해주세요!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 업로드 파일 목록 (추후 구현) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>최근 업로드 파일</CardTitle>
            <CardDescription>
              최근에 업로드된 정산 파일 목록입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                업로드된 파일이 없습니다
              </h3>
              <p className="text-gray-500">
                첫 번째 정산 파일을 업로드해보세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}