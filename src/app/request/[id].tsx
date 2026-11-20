import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequestDetail, useCancelRequest, useDecideRequest } from '@/hooks/use-requests';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/status-badge';
import { LoadingView, ErrorView } from '@/components/feedback-states';
import { RequestStatus } from '@/types/database.types';

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'created':
      return '#2563EB';
    case 'approved':
      return '#059669';
    case 'rejected':
      return '#DC2626';
    case 'cancelled':
      return '#64748B';
    default:
      return '#475569';
  }
}

function getActionIcon(action: string): keyof typeof Ionicons.glyphMap {
  switch (action) {
    case 'created':
      return 'add-circle';
    case 'approved':
      return 'checkmark-circle';
    case 'rejected':
      return 'close-circle';
    case 'cancelled':
      return 'ban';
    default:
      return 'time';
  }
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, role } = useAuth();
  const { data: request, isLoading, isError, error, refetch } = useRequestDetail(id as string);
  const cancelMutation = useCancelRequest();
  const decideMutation = useDecideRequest();

  // Manager Decision Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState<RequestStatus>('approved');
  const [comment, setComment] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingView message="Loading request details..." />;
  }

  if (isError || !request) {
    return (
      <ErrorView
        title="Could not find request"
        message={error?.message || 'This request may have been removed or you do not have permission.'}
        onRetry={() => refetch()}
      />
    );
  }

  const isOwner = user?.id === request.employee_id;
  const isManager = role === 'manager' && !isOwner;
  const isPending = request.status === 'pending';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this pending request? This cannot be undone.',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(request.id);
            } catch (err: any) {
              Alert.alert('Cancellation failed', err.message || 'Unable to cancel request');
            }
          },
        },
      ]
    );
  };

  const openDecisionModal = (type: 'approved' | 'rejected') => {
    setDecisionType(type);
    setComment('');
    setDecisionError(null);
    setModalVisible(true);
  };

  const handleConfirmDecision = async () => {
    if (decisionType === 'rejected' && (!comment || comment.trim() === '')) {
      setDecisionError('A comment explaining the rejection is required.');
      return;
    }

    try {
      await decideMutation.mutateAsync({
        requestId: request.id,
        decision: decisionType,
        comment: comment.trim(),
      });
      setModalVisible(false);
      refetch();
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to submit decision.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{request.type.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <StatusBadge status={request.status} />
          </View>

          <Text style={styles.title}>{request.title}</Text>
          <Text style={styles.submittedBy}>
            Submitted by <Text style={styles.boldText}>{request.employee?.full_name || 'Employee'}</Text>
            {request.employee?.department ? ` • ${request.employee.department}` : ''}
          </Text>

          {request.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Details / Notes</Text>
              <Text style={styles.descriptionText}>{request.description}</Text>
            </View>
          ) : null}

          {request.type === 'leave' && request.start_date && request.end_date ? (
            <View style={styles.leavePeriodBox}>
              <Ionicons name="calendar-outline" size={18} color="#1D4ED8" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.leavePeriodLabel}>Requested Leave Window</Text>
                <Text style={styles.leavePeriodValue}>
                  {request.start_date} to {request.end_date}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Manager Decision & Comment (if already decided) */}
        {request.status !== 'pending' && request.manager_comment ? (
          <View style={[styles.card, styles.decisionCard]}>
            <Text style={styles.cardSectionTitle}>Manager Feedback</Text>
            <Text style={styles.commentText}>{request.manager_comment}</Text>
            {request.decider ? (
              <Text style={styles.deciderText}>
                Decided by {request.decider.full_name}
                {request.decided_at ? ` on ${formatDate(request.decided_at)}` : ''}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Event Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Activity Timeline</Text>
          {request.events && request.events.length > 0 ? (
            <View style={styles.timelineList}>
              {request.events.map((event, idx) => {
                const isLast = idx === (request.events?.length ?? 0) - 1;
                const iconColor = getActionColor(event.action);
                return (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineIconWrapper, { backgroundColor: iconColor }]}>
                        <Ionicons name={getActionIcon(event.action)} size={14} color="#FFFFFF" />
                      </View>
                      {!isLast ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineAction}>
                        Request {event.action.toUpperCase()}
                      </Text>
                      {event.note ? <Text style={styles.timelineNote}>{event.note}</Text> : null}
                      <Text style={styles.timelineDate}>{formatDate(event.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyTimelineText}>No timeline events recorded.</Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bars */}
      {/* 1. Employee Cancel Button (if pending and owner) */}
      {isOwner && isPending ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
            activeOpacity={0.8}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.cancelButtonText}>Cancel This Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 2. Manager Decision Bar (if pending and manager) */}
      {isManager && isPending ? (
        <View style={styles.bottomBarRow}>
          <TouchableOpacity
            style={[styles.decisionActionBtn, styles.rejectBtn]}
            onPress={() => openDecisionModal('rejected')}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={18} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.decisionActionBtn, styles.approveBtn]}
            onPress={() => openDecisionModal('approved')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Decision Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {decisionType === 'approved' ? 'Approve Request' : 'Reject Request'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {decisionType === 'approved'
                ? 'Optionally add a note for the employee.'
                : 'A comment explaining the rejection is required.'}
            </Text>

            {decisionError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{decisionError}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder={
                decisionType === 'approved'
                  ? 'e.g. Approved, enjoy your leave!'
                  : 'e.g. Outside current quarter budget...'
              }
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={decideMutation.isPending}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  decisionType === 'approved' ? styles.approveModalBg : styles.rejectModalBg,
                ]}
                onPress={handleConfirmDecision}
                disabled={decideMutation.isPending}
              >
                {decideMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Confirm {decisionType === 'approved' ? 'Approval' : 'Rejection'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  decisionCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  submittedBy: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  boldText: {
    fontWeight: '600',
    color: '#334155',
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  leavePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  leavePeriodLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  leavePeriodValue: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  deciderText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  timelineAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineNote: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyTimelineText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  bottomBarRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  decisionActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 15,
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveModalBg: {
    backgroundColor: '#059669',
  },
  rejectModalBg: {
    backgroundColor: '#DC2626',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
