'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createBranch, CreateBranchFormData } from '@/app/dashboard/branches/actions'
import { toast } from 'sonner'

// 폼 스키마 (서버 액션과 동일)
const formSchema = z.object({
  name: z.string().min(1, '지점명을 입력해주세요').max(255, '지점명은 255자 이하여야 합니다'),
  code: z.string().min(1, '지점 코드를 입력해주세요').max(50, '지점 코드는 50자 이하여야 합니다').regex(/^[A-Z0-9_]+$/, '지점 코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다'),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager_name: z.string().optional()
})

export function AddBranchDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateBranchFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      phone: '',
      manager_name: ''
    }
  })

  const onSubmit = async (data: CreateBranchFormData) => {
    setIsSubmitting(true)
    
    try {
      const result = await createBranch(data)
      
      if (result.success) {
        // 성공 시 다이얼로그 닫기 및 폼 리셋
        setOpen(false)
        form.reset()
        
        // 성공 토스트 (선택사항 - sonner 라이브러리 필요)
        if (typeof window !== 'undefined') {
          alert(result.message || '지점이 성공적으로 추가되었습니다')
        }
      } else {
        // 에러 처리
        if (typeof window !== 'undefined') {
          alert(result.error || '지점 추가 중 오류가 발생했습니다')
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      if (typeof window !== 'undefined') {
        alert('지점 추가 중 오류가 발생했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          신규 지점 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>신규 지점 추가</DialogTitle>
          <DialogDescription>
            새로운 지점 정보를 입력하여 등록하세요.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지점명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 강남점" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지점 코드 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: GANGNAM" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주소</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 서울시 강남구 테헤란로 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 02-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>관리자 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 김지점" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    추가 중...
                  </>
                ) : (
                  '지점 추가'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}