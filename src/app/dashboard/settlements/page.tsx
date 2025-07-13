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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                정산 파일 업로드
              </CardTitle>
              <CardDescription>
                엑셀 파일을 업로드하여 정산 데이터를 처리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettlementFileUpload />
            </CardContent>
          </Card>

          {/* 업로드 가이드 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                업로드 가이드
              </CardTitle>
              <CardDescription>
                정산 파일 업로드 시 주의사항입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">지원 파일 형식</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Excel 파일 (.xlsx, .xls)</li>
                  <li>• 최대 파일 크기: 10MB</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">파일 구조</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 라이더 ID, 이름 필수 포함</li>
                  <li>• 배달료, 추가수당 등 금액 정보</li>
                  <li>• 보험료, 수수료 등 공제 항목</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">주의사항</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 업로드 전 데이터 검토 필수</li>
                  <li>• 중복 업로드 시 기존 데이터 덮어씀</li>
                  <li>• 처리 시간은 파일 크기에 따라 다름</li>
                </ul>
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