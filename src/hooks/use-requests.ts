import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyRequests,
  getRequestDetail,
  createRequest,
  cancelRequest,
  getPendingApprovals,
  decideRequest,
} from '@/api/requests';
import { RequestStatus } from '@/types/database.types';
import { CreateRequestFormValues } from '@/lib/validation';
import { useAuth } from '@/hooks/use-auth';

export const REQUESTS_KEYS = {
  all: ['requests'] as const,
  myRequests: (filter?: RequestStatus | 'all') => ['requests', 'mine', filter ?? 'all'] as const,
  detail: (id: string) => ['requests', 'detail', id] as const,
  pendingApprovals: () => ['requests', 'pending-approvals'] as const,
};

export function useMyRequests(filter?: RequestStatus | 'all') {
  return useQuery({
    queryKey: REQUESTS_KEYS.myRequests(filter),
    queryFn: () => getMyRequests(filter),
  });
}

export function useRequestDetail(id: string) {
  return useQuery({
    queryKey: REQUESTS_KEYS.detail(id),
    queryFn: () => getRequestDetail(id),
    enabled: Boolean(id),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (values: CreateRequestFormValues) => {
      if (!user?.id) throw new Error('You must be signed in to submit a request');
      return createRequest(values, user.id);
    },
    onSuccess: (newReq) => {
      // Invalidate queries so lists update immediately
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEYS.all });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => cancelRequest(requestId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEYS.all });
      queryClient.setQueryData(REQUESTS_KEYS.detail(updated.id), (old: any) =>
        old ? { ...old, status: 'cancelled' } : old
      );
    },
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: REQUESTS_KEYS.pendingApprovals(),
    queryFn: () => getPendingApprovals(),
  });
}

export function useDecideRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      decision,
      comment,
    }: {
      requestId: string;
      decision: RequestStatus;
      comment?: string;
    }) => decideRequest(requestId, decision, comment),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEYS.all });
    },
  });
}
