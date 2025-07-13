import { getCurrentUser, getCurrentUserProfile, getBranchRiders } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Phone, Mail, Calendar, IdCard } from 'lucide-react'
import { AddRiderDialog } from '@/components/riders/add-rider-dialog'
import { RiderStatusSelector } from '@/components/riders/rider-status-selector'

export default async function RidersPage() {
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

  const riders = await getBranchRiders()

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-3.5rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-slate-800">라이더 관리</h1>
                <p className="text-slate-600 mt-1">
                  {profile.role === 'branch_manager' ? 
                    `${profile.branch?.name || '소속 지점'}의 라이더를 관리합니다` :
                    `${profile.company?.name || '소속 회사'}의 모든 라이더를 관리합니다`
                  }
                </p>
              </div>
            </div>
            <AddRiderDialog />
          </div>
          
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 라이더</p>
                    <p className="text-2xl font-bold">{riders.length}명</p>
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
                    <p className="text-sm font-medium text-gray-600">활성 라이더</p>
                    <p className="text-2xl font-bold">
                      {riders.filter(rider => rider.status === 'active').length}명
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">비활성 라이더</p>
                    <p className="text-2xl font-bold">
                      {riders.filter(rider => rider.status === 'inactive').length}명
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
                    <p className="text-sm font-medium text-gray-600">정지 라이더</p>
                    <p className="text-2xl font-bold">
                      {riders.filter(rider => rider.status === 'suspended').length}명
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 라이더 목록 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              라이더 목록
            </CardTitle>
            <CardDescription>
              등록된 모든 라이더의 상세 정보를 확인하고 관리할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>라이더 ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>입사일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <IdCard className="h-4 w-4 text-gray-400 mr-2" />
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {rider.rider_id}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {rider.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {rider.phone ? (
                            <>
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              {rider.phone}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {rider.email ? (
                            <>
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="max-w-xs truncate" title={rider.email}>
                                {rider.email}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rider.hire_date ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {new Date(rider.hire_date).toLocaleDateString('ko-KR')}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RiderStatusSelector 
                          riderId={rider.id} 
                          currentStatus={rider.status as 'active' | 'inactive' | 'suspended'} 
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(rider.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  등록된 라이더가 없습니다
                </h3>
                <p className="text-gray-500">
                  첫 번째 라이더를 등록하여 시작해보세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}