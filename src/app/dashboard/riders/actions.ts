'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUserProfile, createServerComponentClient } from '@/lib/supabase/server'

// 라이더 추가 폼 스키마
const createRiderSchema = z.object({
  rider_id: z.string().min(1, '라이더 ID를 입력해주세요').max(100, '라이더 ID는 100자 이하여야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(255, '이름은 255자 이하여야 합니다'),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일 형식을 입력해주세요').optional().or(z.literal('')),
  hire_date: z.string().optional(),
  notes: z.string().optional()
})

// 라이더 상태 업데이트 스키마
const updateRiderStatusSchema = z.object({
  riderId: z.string().min(1, '라이더 ID가 필요합니다'),
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: '올바른 상태를 선택해주세요' })
  })
})

export type CreateRiderFormData = z.infer<typeof createRiderSchema>
export type UpdateRiderStatusData = z.infer<typeof updateRiderStatusSchema>

export async function createRider(data: CreateRiderFormData) {
  try {
    // 현재 사용자 프로필 확인
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다')
    }

    // 권한 확인 (branch_manager, company_admin, super_admin)
    const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
    if (!allowedRoles.includes(profile.role || '')) {
      throw new Error('라이더를 추가할 권한이 없습니다')
    }

    if (!profile.company_id) {
      throw new Error('소속 회사 정보를 찾을 수 없습니다')
    }

    // branch_manager는 자신의 지점에만 추가 가능
    let targetBranchId = profile.branch_id
    if (profile.role === 'branch_manager' && !targetBranchId) {
      throw new Error('소속 지점 정보를 찾을 수 없습니다')
    }

    // company_admin이나 super_admin인 경우 기본 지점 사용 (필요시 수정)
    if (!targetBranchId) {
      const supabase = await createServerComponentClient()
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('company_id', profile.company_id)
        .limit(1)
      
      if (!branches || branches.length === 0) {
        throw new Error('사용 가능한 지점이 없습니다')
      }
      targetBranchId = branches[0].id
    }

    // 데이터 유효성 검사
    const validatedData = createRiderSchema.parse(data)

    // Supabase 클라이언트 생성
    const supabase = await createServerComponentClient()

    // 라이더 ID 중복 확인 (같은 회사/지점 내에서)
    const { data: existingRider } = await supabase
      .from('riders')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('branch_id', targetBranchId)
      .eq('rider_id', validatedData.rider_id)
      .single()

    if (existingRider) {
      throw new Error('이미 존재하는 라이더 ID입니다')
    }

    // 라이더 생성
    const { data: newRider, error } = await supabase
      .from('riders')
      .insert({
        company_id: profile.company_id,
        branch_id: targetBranchId,
        rider_id: validatedData.rider_id,
        name: validatedData.name,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        hire_date: validatedData.hire_date ? new Date(validatedData.hire_date).toISOString().split('T')[0] : null,
        notes: validatedData.notes || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating rider:', error)
      throw new Error('라이더 생성 중 오류가 발생했습니다')
    }

    // 페이지 재검증
    revalidatePath('/dashboard/riders')

    return {
      success: true,
      data: newRider,
      message: '라이더가 성공적으로 추가되었습니다'
    }

  } catch (error: any) {
    console.error('Create rider error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }

    return {
      success: false,
      error: error.message || '라이더 추가 중 오류가 발생했습니다'
    }
  }
}

export async function updateRiderStatus(data: UpdateRiderStatusData) {
  try {
    // 현재 사용자 프로필 확인
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다')
    }

    // 권한 확인
    const allowedRoles = ['branch_manager', 'company_admin', 'super_admin']
    if (!allowedRoles.includes(profile.role || '')) {
      throw new Error('라이더 상태를 변경할 권한이 없습니다')
    }

    // 데이터 유효성 검사
    const validatedData = updateRiderStatusSchema.parse(data)

    const supabase = await createServerComponentClient()

    // 라이더 존재 확인 및 권한 확인
    let query = supabase
      .from('riders')
      .select('*')
      .eq('id', validatedData.riderId)
      .eq('company_id', profile.company_id)

    // branch_manager는 자신의 지점 라이더만 수정 가능
    if (profile.role === 'branch_manager' && profile.branch_id) {
      query = query.eq('branch_id', profile.branch_id)
    }

    const { data: rider, error: fetchError } = await query.single()

    if (fetchError || !rider) {
      throw new Error('라이더를 찾을 수 없거나 권한이 없습니다')
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from('riders')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.riderId)

    if (updateError) {
      console.error('Error updating rider status:', updateError)
      throw new Error('라이더 상태 업데이트 중 오류가 발생했습니다')
    }

    // 페이지 재검증
    revalidatePath('/dashboard/riders')

    return {
      success: true,
      message: '라이더 상태가 성공적으로 업데이트되었습니다'
    }

  } catch (error: any) {
    console.error('Update rider status error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }

    return {
      success: false,
      error: error.message || '라이더 상태 업데이트 중 오류가 발생했습니다'
    }
  }
}