export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'employee' | 'manager';
export type RequestType = 'leave' | 'equipment' | 'it_support';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ActionType = 'created' | 'approved' | 'rejected' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          department: string | null;
          role: UserRole;
          manager_id: string | null;
          expo_push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          department?: string | null;
          role?: UserRole;
          manager_id?: string | null;
          expo_push_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          department?: string | null;
          role?: UserRole;
          manager_id?: string | null;
          expo_push_token?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_manager_id_fkey';
            columns: ['manager_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      requests: {
        Row: {
          id: string;
          employee_id: string;
          type: RequestType;
          title: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          status: RequestStatus;
          manager_comment: string | null;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          type: RequestType;
          title: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: RequestStatus;
          manager_comment?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          type?: RequestType;
          title?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: RequestStatus;
          manager_comment?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'requests_employee_id_fkey';
            columns: ['employee_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_decided_by_fkey';
            columns: ['decided_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      request_events: {
        Row: {
          id: string;
          request_id: string;
          actor_id: string;
          action: ActionType;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          actor_id: string;
          action: ActionType;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          actor_id?: string;
          action?: ActionType;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'request_events_request_id_fkey';
            columns: ['request_id'];
            referencedRelation: 'requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'request_events_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decide_request: {
        Args: {
          p_request_id: string;
          p_decision: RequestStatus;
          p_comment?: string | null;
        };
        Returns: Database['public']['Tables']['requests']['Row'];
      };
    };
    Enums: {
      user_role: UserRole;
      request_type: RequestType;
      request_status: RequestStatus;
    };
  };
}
