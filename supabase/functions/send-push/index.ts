// Supabase Edge Function: send-push
// Invoked via database webhook when requests are created or decided

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: {
    id: string;
    employee_id: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    manager_comment?: string | null;
  };
  old_record?: {
    status: string;
  };
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    const { record, type, old_record } = payload;

    const messages = [];

    // Case 1: New request created -> notify manager
    if (type === 'INSERT' && record.status === 'pending') {
      // Get employee's manager
      const { data: employee } = await supabase
        .from('profiles')
        .select('full_name, manager_id')
        .eq('id', record.employee_id)
        .single();

      if (employee?.manager_id) {
        const { data: manager } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('id', employee.manager_id)
          .single();

        if (manager?.expo_push_token) {
          messages.push({
            to: manager.expo_push_token,
            sound: 'default',
            title: `New Request: ${employee.full_name}`,
            body: record.title,
            data: { requestId: record.id },
          });
        }
      }
    }

    // Case 2: Request decided (approved or rejected) -> notify employee
    if (
      type === 'UPDATE' &&
      old_record?.status === 'pending' &&
      (record.status === 'approved' || record.status === 'rejected')
    ) {
      const { data: employee } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', record.employee_id)
        .single();

      if (employee?.expo_push_token) {
        const decisionText = record.status === 'approved' ? 'Approved' : 'Rejected';
        messages.push({
          to: employee.expo_push_token,
          sound: 'default',
          title: `Request ${decisionText}`,
          body: `"${record.title}" was ${record.status}.${
            record.manager_comment ? ` Comment: ${record.manager_comment}` : ''
          }`,
          data: { requestId: record.id },
        });
      }
    }

    // Send push via Expo Push API
    if (messages.length > 0) {
      const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await expoPushResponse.json();
      return new Response(JSON.stringify({ sent: true, result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sent: false, reason: 'No push recipient' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
