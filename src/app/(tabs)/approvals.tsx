import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePendingApprovals } from '@/hooks/use-requests';
import { StatusBadge } from '@/components/status-badge';
import { LoadingView, EmptyView, ErrorView } from '@/components/feedback-states';
import { RequestWithDetails } from '@/api/requests';

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'leave':
      return 'calendar-outline';
    case 'equipment':
      return 'laptop-outline';
    case 'it_support':
      return 'hardware-chip-outline';
    default:
      return 'document-text-outline';
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ApprovalsScreen() {
  const router = useRouter();
  const { data: approvals, isLoading, isError, error, refetch, isRefetching } = usePendingApprovals();

  const renderItem = ({ item }: { item: RequestWithDetails }) => {
    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.employee?.full_name?.charAt(0).toUpperCase() || 'E'}
              </Text>
            </View>
            <View>
              <Text style={styles.employeeName}>{item.employee?.full_name || 'Direct Report'}</Text>
              <Text style={styles.departmentText}>{item.employee?.department || 'Team Member'}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.divider} />

        <View style={styles.typeRow}>
          <View style={styles.typeTag}>
            <Ionicons name={getTypeIcon(item.type)} size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.typeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.submittedDate}>Submitted {formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.type === 'leave' && item.start_date && item.end_date ? (
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>
              {item.start_date} to {item.end_date}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardActionRow}>
          <Text style={styles.reviewPrompt}>Tap to Review & Decide</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#2563EB" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingView message="Loading pending team requests..." />;
  }

  if (isError) {
    return (
      <ErrorView
        title="Could not load approvals"
        message={error?.message || 'Something went wrong loading pending team requests.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <EmptyView
        icon="checkmark-done-circle-outline"
        title="All caught up!"
        description="There are no pending requests from your direct reports awaiting your approval."
        actionLabel="Refresh List"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBanner}>
        <Ionicons name="information-circle" size={18} color="#2563EB" style={{ marginRight: 6 }} />
        <Text style={styles.bannerText}>
          {approvals.length} request{approvals.length > 1 ? 's' : ''} awaiting your review
        </Text>
      </View>

      <FlatList
        data={approvals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  bannerText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  departmentText: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  submittedDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  reviewPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
