'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { RiderInsert, RiderUpdate } from '@/types/supabase'

// 라이더 목록 조회 (회사/지점별)
export function useRiders(companyId?: string, branchId?: string) {
  return useQuery({
    queryKey: ['riders', companyId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('riders')
        .select(`
          *,
          company:companies(name),
          branch:branches(name, code)
        `)
        .order('created_at', { ascending: false })

      if (companyId) {
        query = query.eq('company_id', companyId)
      }
      
      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data
    },
    enabled: !!companyId || !!branchId,
  })
}

// 특정 라이더 조회
export function useRider(id: string) {
  return useQuery({
    queryKey: ['riders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select(`
          *,
          company:companies(name),
          branch:branches(name, code)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// 라이더 생성
export function useCreateRider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (rider: RiderInsert) => {
      const { data, error } = await supabase
        .from('riders')
        .insert(rider)
        .select(`
          *,
          company:companies(name),
          branch:branches(name, code)
        `)
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['riders', data.company_id, data.branch_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['riders', data.company_id] 
      })
    },
  })
}

// 라이더 수정
export function useUpdateRider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RiderUpdate }) => {
      const { data, error } = await supabase
        .from('riders')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          company:companies(name),
          branch:branches(name, code)
        `)
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['riders', data.company_id, data.branch_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['riders', data.company_id] 
      })
      queryClient.invalidateQueries({ queryKey: ['riders', data.id] })
    },
  })
}

// 라이더 삭제
export function useDeleteRider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // 먼저 라이더 정보를 가져와서 company_id, branch_id 확인
      const { data: rider } = await supabase
        .from('riders')
        .select('company_id, branch_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return rider
    },
    onSuccess: (rider) => {
      if (rider) {
        queryClient.invalidateQueries({ 
          queryKey: ['riders', rider.company_id, rider.branch_id] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['riders', rider.company_id] 
        })
      }
    },
  })
}

// 라이더 상태별 통계
export function useRiderStats(companyId?: string, branchId?: string) {
  return useQuery({
    queryKey: ['rider-stats', companyId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('riders')
        .select('status')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }
      
      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      // 상태별 카운트 계산
      const stats = data.reduce((acc, rider) => {
        acc[rider.status] = (acc[rider.status] || 0) + 1
        acc.total = (acc.total || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return stats
    },
    enabled: !!companyId || !!branchId,
  })
}