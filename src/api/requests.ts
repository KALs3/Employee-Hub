import { supabase } from '@/lib/supabase';
import { Database, RequestStatus, RequestType } from '@/types/database.types';
import { CreateRequestFormValues } from '@/lib/validation';

export type RequestRow = Database['public']['Tables']['requests']['Row'];
export type RequestEventRow = Database['public']['Tables']['request_events']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface RequestWithDetails extends RequestRow {
  employee?: {
    id: string;
    full_name: string;
    department: string | null;
  } | null;
  decider?: {
    id: string;
    full_name: string;
  } | null;
  events?: RequestEventRow[];
}

/**
 * Fetch requests submitted by the logged in employee, ordered newest first.
 */
export async function getMyRequests(statusFilter?: RequestStatus | 'all'): Promise<RequestRow[]> {
  let query = supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

/**
 * Fetch a single request with its full event timeline and employee/manager details.
 */
export async function getRequestDetail(id: string): Promise<RequestWithDetails> {
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single();

  if (reqError || !request) {
    throw new Error(reqError?.message || 'Request not found');
  }

  // Fetch employee info
  const { data: employeeData } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('id', request.employee_id)
    .single();

  // Fetch decider info if decided
  let deciderData = null;
  if (request.decided_by) {
    const { data: dData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', request.decided_by)
      .single();
    deciderData = dData;
  }

  // Fetch event timeline
  const { data: events, error: eventsError } = await supabase
    .from('request_events')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  if (eventsError) {
    // If fetching events fails, still return request with empty events
    return {
      ...request,
      employee: employeeData,
      decider: deciderData,
      events: [],
    };
  }

  return {
    ...request,
    employee: employeeData,
    decider: deciderData,
    events: events || [],
  };
}

/**
 * Create a new request for the logged-in employee.
 */
export async function createRequest(
  values: CreateRequestFormValues,
  employeeId: string
): Promise<RequestRow> {
  const payload = {
    employee_id: employeeId,
    type: values.type as RequestType,
    title: values.title.trim(),
    description: values.description ? values.description.trim() : null,
    start_date: values.type === 'leave' && values.start_date ? values.start_date : null,
    end_date: values.type === 'leave' && values.end_date ? values.end_date : null,
    status: 'pending' as RequestStatus,
  };

  const { data, error } = await supabase
    .from('requests')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to submit request');
  }

  return data;
}

/**
 * Cancel a pending request by the employee.
 */
export async function cancelRequest(requestId: string): Promise<RequestRow> {
  const { data, error } = await supabase
    .from('requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to cancel request');
  }

  return data;
}

/**
 * Fetch pending requests from direct reports for manager approval, oldest first.
 */
export async function getPendingApprovals(): Promise<RequestWithDetails[]> {
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  // Populate employee details for each request
  const employeeIds = Array.from(new Set(requests.map((r) => r.employee_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .in('id', employeeIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return requests.map((req) => ({
    ...req,
    employee: profileMap.get(req.employee_id) || null,
  }));
}

/**
 * Manager decision: approve or reject a pending request via Postgres RPC function.
 */
export async function decideRequest(
  requestId: string,
  decision: RequestStatus,
  comment?: string
): Promise<RequestRow> {
  const { data, error } = await supabase.rpc('decide_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_comment: comment && comment.trim() !== '' ? comment.trim() : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
