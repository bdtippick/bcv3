import { getCurrentUser, getCurrentUserProfile, getCompanyBranches } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, MapPin, Phone, User, Calendar } from 'lucide-react'
import { AddBranchDialog } from '@/components/branches/add-branch-dialog'

export default async function BranchesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  const profile = await getCurrentUserProfile()

  // company_admin 권한 확인
  if (!profile || (profile.role !== 'company_admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  const branches = await getCompanyBranches()

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-3.5rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-slate-800">지점 관리</h1>
                <p className="text-slate-600 mt-1">
                  {profile.company?.name}의 모든 지점을 관리합니다
                </p>
              </div>
            </div>
            <AddBranchDialog />
          </div>
          
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 지점</p>
                    <p className="text-2xl font-bold">{branches.length}개</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">운영중 지점</p>
                    <p className="text-2xl font-bold">
                      {branches.filter(branch => branch.status === 'active').length}개
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-red-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">비활성 지점</p>
                    <p className="text-2xl font-bold">
                      {branches.filter(branch => branch.status === 'inactive').length}개
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 지점 목록 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              지점 목록
            </CardTitle>
            <CardDescription>
              등록된 모든 지점의 상세 정보를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지점명</TableHead>
                    <TableHead>지점코드</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>관리자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          {branch.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {branch.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={branch.address || '-'}>
                          {branch.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {branch.phone ? (
                            <>
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              {branch.phone}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {branch.manager_name ? (
                            <>
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              {branch.manager_name}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          branch.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.status === 'active' ? '운영중' : '비활성'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(branch.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  등록된 지점이 없습니다
                </h3>
                <p className="text-gray-500">
                  첫 번째 지점을 등록하여 시작해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}