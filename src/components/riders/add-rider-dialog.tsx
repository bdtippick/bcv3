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
import { createRider, CreateRiderFormData } from '@/app/dashboard/riders/actions'

// 폼 스키마 (서버 액션과 동일)
const formSchema = z.object({
  rider_id: z.string().min(1, '라이더 ID를 입력해주세요').max(100, '라이더 ID는 100자 이하여야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(255, '이름은 255자 이하여야 합니다'),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일 형식을 입력해주세요').optional().or(z.literal('')),
  hire_date: z.string().optional(),
  notes: z.string().optional()
})

export function AddRiderDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateRiderFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rider_id: '',
      name: '',
      phone: '',
      email: '',
      hire_date: '',
      notes: ''
    }
  })

  const onSubmit = async (data: CreateRiderFormData) => {
    setIsSubmitting(true)
    
    try {
      const result = await createRider(data)
      
      if (result.success) {
        // 성공 시 다이얼로그 닫기 및 폼 리셋
        setOpen(false)
        form.reset()
        
        // 성공 메시지
        if (typeof window !== 'undefined') {
          alert(result.message || '라이더가 성공적으로 추가되었습니다')
        }
      } else {
        // 에러 처리
        if (typeof window !== 'undefined') {
          alert(result.error || '라이더 추가 중 오류가 발생했습니다')
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      if (typeof window !== 'undefined') {
        alert('라이더 추가 중 오류가 발생했습니다')
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
          신규 라이더 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 라이더 추가</DialogTitle>
          <DialogDescription>
            새로운 라이더 정보를 입력하여 등록하세요.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>라이더 ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: RIDER001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 김라이더" {...field} />
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
                    <Input placeholder="예: 010-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="예: rider@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>입사일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Input placeholder="추가 정보나 메모를 입력하세요" {...field} />
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
                  '라이더 추가'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}