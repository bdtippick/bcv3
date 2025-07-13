export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          business_number: string | null
          address: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          company_id: string
          name: string
          code: string
          address: string | null
          phone: string | null
          manager_name: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          code: string
          address?: string | null
          phone?: string | null
          manager_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          code?: string
          address?: string | null
          phone?: string | null
          manager_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          company_id: string
          branch_id: string | null
          name: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          branch_id?: string | null
          name: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string | null
          name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      delivery_platforms: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      platform_settings: {
        Row: {
          id: string
          company_id: string
          branch_id: string
          platform_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id: string
          platform_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string
          platform_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      riders: {
        Row: {
          id: string
          company_id: string
          branch_id: string
          rider_id: string
          name: string
          phone: string | null
          email: string | null
          hire_date: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id: string
          rider_id: string
          name: string
          phone?: string | null
          email?: string | null
          hire_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string
          rider_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          hire_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settlement_periods: {
        Row: {
          id: string
          company_id: string
          branch_id: string
          platform_id: string
          period_name: string
          start_date: string
          end_date: string
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id: string
          platform_id: string
          period_name: string
          start_date: string
          end_date: string
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string
          platform_id?: string
          period_name?: string
          start_date?: string
          end_date?: string
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settlement_records: {
        Row: {
          id: string
          settlement_period_id: string
          rider_id: string
          platform_id: string
          rider_code: string
          rider_name: string
          process_count: number
          delivery_fee: number
          additional_payment: number
          branch_promotion: number
          employment_insurance: number
          accident_insurance: number
          hourly_insurance: number
          employment_retroactive: number
          accident_retroactive: number
          commission: number
          rebate: number
          total_delivery_fee: number
          settlement_amount: number
          withholding_tax: number
          final_payment: number
          platform_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          settlement_period_id: string
          rider_id: string
          platform_id: string
          rider_code: string
          rider_name: string
          process_count?: number
          delivery_fee?: number
          additional_payment?: number
          branch_promotion?: number
          employment_insurance?: number
          accident_insurance?: number
          hourly_insurance?: number
          employment_retroactive?: number
          accident_retroactive?: number
          commission?: number
          rebate?: number
          platform_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          settlement_period_id?: string
          rider_id?: string
          platform_id?: string
          rider_code?: string
          rider_name?: string
          process_count?: number
          delivery_fee?: number
          additional_payment?: number
          branch_promotion?: number
          employment_insurance?: number
          accident_insurance?: number
          hourly_insurance?: number
          employment_retroactive?: number
          accident_retroactive?: number
          commission?: number
          rebate?: number
          platform_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          company_id: string
          branch_id: string
          settlement_period_id: string
          platform_id: string
          original_filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          upload_status: string
          total_records: number
          processed_records: number
          error_records: number
          processing_log: Json
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id: string
          settlement_period_id: string
          platform_id: string
          original_filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          upload_status?: string
          total_records?: number
          processed_records?: number
          error_records?: number
          processing_log?: Json
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string
          settlement_period_id?: string
          platform_id?: string
          original_filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          upload_status?: string
          total_records?: number
          processed_records?: number
          error_records?: number
          processing_log?: Json
          uploaded_by?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          identity: string | null
          action: string
          table_name: string
          record_id: string | null
          old_record: Json | null
          new_record: Json | null
          timestamp: string
        }
        Insert: {
          id?: number
          identity?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_record?: Json | null
          new_record?: Json | null
          timestamp?: string
        }
        Update: {
          id?: number
          identity?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_record?: Json | null
          new_record?: Json | null
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_settlement_period: {
        Args: {
          p_branch_id: string
          p_platform_id: string
          p_period_name: string
          p_start_date: string
          p_end_date: string
        }
        Returns: string
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          role: string
          company_id: string
          branch_id: string
        }[]
      }
      get_my_claim: {
        Args: {
          claim: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의를 위한 타입 별칭
export type Company = Database['public']['Tables']['companies']['Row']
export type Branch = Database['public']['Tables']['branches']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type DeliveryPlatform = Database['public']['Tables']['delivery_platforms']['Row']
export type PlatformSetting = Database['public']['Tables']['platform_settings']['Row']
export type Rider = Database['public']['Tables']['riders']['Row']
export type SettlementPeriod = Database['public']['Tables']['settlement_periods']['Row']
export type SettlementRecord = Database['public']['Tables']['settlement_records']['Row']
export type UploadedFile = Database['public']['Tables']['uploaded_files']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Insert 타입 별칭
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type BranchInsert = Database['public']['Tables']['branches']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type DeliveryPlatformInsert = Database['public']['Tables']['delivery_platforms']['Insert']
export type PlatformSettingInsert = Database['public']['Tables']['platform_settings']['Insert']
export type RiderInsert = Database['public']['Tables']['riders']['Insert']
export type SettlementPeriodInsert = Database['public']['Tables']['settlement_periods']['Insert']
export type SettlementRecordInsert = Database['public']['Tables']['settlement_records']['Insert']
export type UploadedFileInsert = Database['public']['Tables']['uploaded_files']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

// Update 타입 별칭
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type BranchUpdate = Database['public']['Tables']['branches']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type DeliveryPlatformUpdate = Database['public']['Tables']['delivery_platforms']['Update']
export type PlatformSettingUpdate = Database['public']['Tables']['platform_settings']['Update']
export type RiderUpdate = Database['public']['Tables']['riders']['Update']
export type SettlementPeriodUpdate = Database['public']['Tables']['settlement_periods']['Update']
export type SettlementRecordUpdate = Database['public']['Tables']['settlement_records']['Update']
export type UploadedFileUpdate = Database['public']['Tables']['uploaded_files']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update']

// Enum 타입들
export type UserRole = 'super_admin' | 'company_admin' | 'branch_manager' | 'user'
export type BranchStatus = 'active' | 'inactive'
export type RiderStatus = 'active' | 'inactive' | 'suspended'
export type SettlementPeriodStatus = 'draft' | 'processing' | 'completed' | 'cancelled'
export type UploadStatus = 'uploaded' | 'processing' | 'processed' | 'error'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'