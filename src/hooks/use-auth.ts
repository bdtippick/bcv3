'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getCurrentUser, 
  getCurrentUserProfile, 
  signIn, 
  signOut,
  onAuthStateChange
} from '@/lib/supabase/client'
import { useEffect } from 'react'

// 현재 사용자 정보 가져오기
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 현재 사용자 프로필 가져오기
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: getCurrentUserProfile,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 로그인 mutation
export function useSignIn() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      signIn(email, password),
    onSuccess: () => {
      // 성공 시 사용자 관련 쿼리 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

// 로그아웃 mutation
export function useSignOut() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // 로그아웃 시 모든 쿼리 캐시 클리어
      queryClient.clear()
    },
  })
}

// 인증 상태 변화 감지
export function useAuthStateChange() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { data: subscription } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['user'] })
        queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [queryClient])
}