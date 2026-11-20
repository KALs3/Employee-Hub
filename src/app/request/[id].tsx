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
import { Colors, Shadows } from '@/constants/theme';

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
      return Colors.primary;
    case 'approved':
      return Colors.success;
    case 'rejected':
      return Colors.error;
    case 'cancelled':
      return Colors.cancelled;
    default:
      return Colors.onSurfaceVariant;
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

  // Manager Decision Modal
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
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  const isOwner = user?.id === request.employee_id;
  const isManager = role === 'manager' && !isOwner;
  const isPending = request.status === 'pending';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request? This action cannot be reversed.',
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {request.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <StatusBadge status={request.status} />
          </View>

          <Text style={styles.requestTitle}>{request.title}</Text>

          {/* Submitter Info Row */}
          <View style={styles.submitterRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {request.employee?.full_name?.charAt(0).toUpperCase() || 'E'}
              </Text>
            </View>
            <View style={styles.submitterMeta}>
              <Text style={styles.submitterName}>{request.employee?.full_name || 'Employee'}</Text>
              <Text style={styles.submitterDept}>
                {request.employee?.department || 'Team Member'} • Submitted {formatDate(request.created_at)}
              </Text>
            </View>
          </View>

          {/* Leave Window (if applicable) */}
          {request.type === 'leave' && request.start_date && request.end_date ? (
            <View style={styles.leavePeriodBox}>
              <Ionicons name="calendar" size={18} color={Colors.secondary} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.leavePeriodLabel}>Requested Leave Period</Text>
                <Text style={styles.leavePeriodValue}>
                  {request.start_date} to {request.end_date}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Description */}
          {request.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Justification / Notes</Text>
              <Text style={styles.descriptionText}>{request.description}</Text>
            </View>
          ) : null}
        </View>

        {/* Manager Decision Feedback (if decided) */}
        {request.status !== 'pending' && request.manager_comment ? (
          <View style={[styles.card, styles.decisionCard]}>
            <View style={styles.decisionHeader}>
              <Ionicons
                name={request.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={request.status === 'approved' ? Colors.success : Colors.error}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.decisionTitle}>
                Manager Feedback ({request.status.toUpperCase()})
              </Text>
            </View>
            <Text style={styles.decisionComment}>{`"${request.manager_comment}"`}</Text>
            {request.decider ? (
              <Text style={styles.deciderName}>
                Decided by {request.decider.full_name}
                {request.decided_at ? ` on ${formatDate(request.decided_at)}` : ''}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Visual Activity Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ACTIVITY & AUDIT TIMELINE</Text>
          {request.events && request.events.length > 0 ? (
            <View style={styles.timelineList}>
              {request.events.map((event, idx) => {
                const isLast = idx === (request.events?.length ?? 0) - 1;
                const nodeColor = getActionColor(event.action);
                return (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineNode, { backgroundColor: nodeColor }]}>
                        <Ionicons name={getActionIcon(event.action)} size={12} color="#FFFFFF" />
                      </View>
                      {!isLast ? <View style={styles.timelineConnector} /> : null}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineActionTitle}>
                        Request {event.action.toUpperCase()}
                      </Text>
                      {event.note ? <Text style={styles.timelineNote}>{event.note}</Text> : null}
                      <Text style={styles.timelineTime}>{formatDate(event.created_at)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyTimelineText}>No timeline history recorded.</Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bars */}
      {isOwner && isPending ? (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
            activeOpacity={0.85}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={Colors.error} style={{ marginRight: 6 }} />
                <Text style={styles.cancelButtonText}>Cancel This Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {isManager && isPending ? (
        <View style={styles.floatingBarRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => openDecisionModal('rejected')}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={18} color={Colors.error} style={{ marginRight: 4 }} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => openDecisionModal('approved')}
            activeOpacity={0.85}
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
                ? 'Optionally add a note or instructions for the employee.'
                : 'A comment explaining the rejection reason is strictly required.'}
            </Text>

            {decisionError ? (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} style={{ marginRight: 4 }} />
                <Text style={styles.modalErrorText}>{decisionError}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder={
                decisionType === 'approved'
                  ? 'e.g. Approved, enjoy your leave!'
                  : 'e.g. Current quarterly budget has been allocated...'
              }
              placeholderTextColor={Colors.outline}
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 12,
  },
  submitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitterMeta: {
    flex: 1,
  },
  submitterName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  submitterDept: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  leavePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.secondaryFixed,
  },
  leavePeriodLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  leavePeriodValue: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  descriptionBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  decisionCard: {
    backgroundColor: '#F8FAFF',
    borderColor: Colors.secondaryFixed,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  decisionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  decisionComment: {
    fontSize: 14,
    color: Colors.onSurface,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  deciderName: {
    fontSize: 12,
    color: Colors.outline,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 18,
  },
  timelineActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  timelineNote: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: Colors.outline,
    marginTop: 3,
  },
  emptyTimelineText: {
    fontSize: 12,
    color: Colors.outline,
    fontStyle: 'italic',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    ...Shadows.md,
  },
  floatingBarRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    ...Shadows.md,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorContainer,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
  rejectBtn: {
    backgroundColor: Colors.errorContainer,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalErrorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: Colors.onSurface,
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
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.onSurfaceVariant,
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
    backgroundColor: Colors.success,
  },
  rejectModalBg: {
    backgroundColor: Colors.error,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
