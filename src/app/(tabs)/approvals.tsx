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
import { Colors, Shadows } from '@/constants/theme';

function getTypeConfig(type: string) {
  switch (type) {
    case 'leave':
      return {
        label: 'Leave',
        icon: 'calendar-outline' as const,
        bg: Colors.primaryFixed,
        text: Colors.primary,
      };
    case 'equipment':
      return {
        label: 'Equipment',
        icon: 'laptop-outline' as const,
        bg: '#EDE9FE',
        text: '#6D28D9',
      };
    case 'it_support':
      return {
        label: 'IT Support',
        icon: 'hardware-chip-outline' as const,
        bg: '#FEF3C7',
        text: '#B45309',
      };
    default:
      return {
        label: type,
        icon: 'document-text-outline' as const,
        bg: Colors.surfaceContainer,
        text: Colors.onSurfaceVariant,
      };
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
    const typeCfg = getTypeConfig(item.type);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
        activeOpacity={0.8}
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
          <View style={[styles.typeBadge, { backgroundColor: typeCfg.bg }]}>
            <Ionicons
              name={typeCfg.icon}
              size={13}
              color={typeCfg.text}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.typeBadgeText, { color: typeCfg.text }]}>
              {typeCfg.label}
            </Text>
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
          <View style={styles.datePill}>
            <Ionicons name="calendar" size={13} color={Colors.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.datePillText}>
              {item.start_date} → {item.end_date}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardActionRow}>
          <Text style={styles.reviewPrompt}>Review & Decide</Text>
          <Ionicons name="arrow-forward-circle" size={20} color={Colors.secondary} />
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
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <EmptyView
        icon="checkmark-done-circle-outline"
        title="All caught up!"
        description="There are currently no pending requests from your direct reports awaiting your approval."
        actionLabel="Refresh List"
        onAction={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Stitch Approvals Header Banner */}
      <View style={styles.headerBanner}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.secondary} style={{ marginRight: 8 }} />
        <Text style={styles.bannerText}>
          {approvals.length} request{approvals.length > 1 ? 's' : ''} awaiting your review
        </Text>
      </View>

      <FlatList
        data={approvals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  bannerText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
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
    color: Colors.onSurface,
  },
  departmentText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submittedDate: {
    fontSize: 12,
    color: Colors.outline,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  datePillText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  reviewPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
});
