'use client'

import { useState } from 'react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateRiderStatus } from '@/app/dashboard/riders/actions'

interface RiderStatusSelectorProps {
  riderId: string
  currentStatus: 'active' | 'inactive' | 'suspended'
}

const statusOptions = [
  { value: 'active', label: '활성', color: 'text-green-600 bg-green-100' },
  { value: 'inactive', label: '비활성', color: 'text-gray-600 bg-gray-100' },
  { value: 'suspended', label: '정지', color: 'text-red-600 bg-red-100' }
] as const

export function RiderStatusSelector({ riderId, currentStatus }: RiderStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return

    setIsUpdating(true)
    
    try {
      const result = await updateRiderStatus({
        riderId,
        status: newStatus as 'active' | 'inactive' | 'suspended'
      })
      
      if (result.success) {
        if (typeof window !== 'undefined') {
          // 성공 메시지 (선택사항)
        }
      } else {
        if (typeof window !== 'undefined') {
          alert(result.error || '상태 변경 중 오류가 발생했습니다')
        }
      }
    } catch (error) {
      console.error('Status update error:', error)
      if (typeof window !== 'undefined') {
        alert('상태 변경 중 오류가 발생했습니다')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const currentOption = statusOptions.find(option => option.value === currentStatus)

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-24">
        <SelectValue>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentOption?.color}`}>
            {currentOption?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}