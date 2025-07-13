export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number
          identity: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name: string
          record_id: string | null
          old_record: Json | null
          new_record: Json | null
          timestamp: string
        }
        Insert: {
          id?: number
          identity?: string | null
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name: string
          record_id?: string | null
          old_record?: Json | null
          new_record?: Json | null
          timestamp?: string
        }
        Update: {
          id?: number
          identity?: string | null
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          table_name?: string
          record_id?: string | null
          old_record?: Json | null
          new_record?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_identity_fkey"
            columns: ["identity"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          status: 'active' | 'inactive'
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
          status?: 'active' | 'inactive'
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
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "platform_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "delivery_platforms"
            referencedColumns: ["id"]
          },
        ]
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
          status: 'active' | 'inactive' | 'suspended'
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
          status?: 'active' | 'inactive' | 'suspended'
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
          status?: 'active' | 'inactive' | 'suspended'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
          status: 'draft' | 'processing' | 'completed' | 'cancelled'
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
          status?: 'draft' | 'processing' | 'completed' | 'cancelled'
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
          status?: 'draft' | 'processing' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_periods_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_periods_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "delivery_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          total_delivery_fee: number // Generated column
          settlement_amount: number // Generated column
          withholding_tax: number // Generated column
          final_payment: number // Generated column
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
          // Generated columns are not included in Insert
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
          // Generated columns are not included in Update
          platform_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_records_settlement_period_id_fkey"
            columns: ["settlement_period_id"]
            isOneToOne: false
            referencedRelation: "settlement_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_records_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_records_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "delivery_platforms"
            referencedColumns: ["id"]
          },
        ]
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
          upload_status: 'uploaded' | 'processing' | 'processed' | 'error'
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
          upload_status?: 'uploaded' | 'processing' | 'processed' | 'error'
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
          upload_status?: 'uploaded' | 'processing' | 'processed' | 'error'
          total_records?: number
          processed_records?: number
          error_records?: number
          processing_log?: Json
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_settlement_period_id_fkey"
            columns: ["settlement_period_id"]
            isOneToOne: false
            referencedRelation: "settlement_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "delivery_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          id: string
          company_id: string
          branch_id: string | null
          name: string
          email: string
          role: 'super_admin' | 'company_admin' | 'branch_manager' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          branch_id?: string | null
          name: string
          email: string
          role?: 'super_admin' | 'company_admin' | 'branch_manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string | null
          name?: string
          email?: string
          role?: 'super_admin' | 'company_admin' | 'branch_manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
          role: string | null
          company_id: string | null
          branch_id: string | null
        }[]
      }
      get_my_claim: {
        Args: {
          claim: string
        }
        Returns: Json
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

// 편의를 위한 타입 별칭들
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// 개별 테이블 타입 별칭
export type Company = Tables<'companies'>
export type CompanyInsert = TablesInsert<'companies'>
export type CompanyUpdate = TablesUpdate<'companies'>

export type Branch = Tables<'branches'>
export type BranchInsert = TablesInsert<'branches'>
export type BranchUpdate = TablesUpdate<'branches'>

export type UserProfile = Tables<'user_profiles'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

export type DeliveryPlatform = Tables<'delivery_platforms'>
export type DeliveryPlatformInsert = TablesInsert<'delivery_platforms'>
export type DeliveryPlatformUpdate = TablesUpdate<'delivery_platforms'>

export type PlatformSetting = Tables<'platform_settings'>
export type PlatformSettingInsert = TablesInsert<'platform_settings'>
export type PlatformSettingUpdate = TablesUpdate<'platform_settings'>

export type Rider = Tables<'riders'>
export type RiderInsert = TablesInsert<'riders'>
export type RiderUpdate = TablesUpdate<'riders'>

export type SettlementPeriod = Tables<'settlement_periods'>
export type SettlementPeriodInsert = TablesInsert<'settlement_periods'>
export type SettlementPeriodUpdate = TablesUpdate<'settlement_periods'>

export type SettlementRecord = Tables<'settlement_records'>
export type SettlementRecordInsert = TablesInsert<'settlement_records'>
export type SettlementRecordUpdate = TablesUpdate<'settlement_records'>

export type UploadedFile = Tables<'uploaded_files'>
export type UploadedFileInsert = TablesInsert<'uploaded_files'>
export type UploadedFileUpdate = TablesUpdate<'uploaded_files'>

export type AuditLog = Tables<'audit_logs'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>

// Enum 타입들
export type UserRole = 'super_admin' | 'company_admin' | 'branch_manager' | 'user'
export type BranchStatus = 'active' | 'inactive'
export type RiderStatus = 'active' | 'inactive' | 'suspended'
export type SettlementPeriodStatus = 'draft' | 'processing' | 'completed' | 'cancelled'
export type UploadStatus = 'uploaded' | 'processing' | 'processed' | 'error'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'