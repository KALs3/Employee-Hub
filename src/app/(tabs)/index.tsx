import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyRequests } from '@/hooks/use-requests';
import { useAuth } from '@/hooks/use-auth';
import { RequestStatus } from '@/types/database.types';
import { StatusBadge } from '@/components/status-badge';
import { LoadingView, EmptyView, ErrorView } from '@/components/feedback-states';
import { RequestRow } from '@/api/requests';
import { Colors, Shadows } from '@/constants/theme';

type FilterType = RequestStatus | 'all';

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

function getStatusAccentColor(status: RequestStatus) {
  switch (status) {
    case 'pending':
      return Colors.warning;
    case 'approved':
      return Colors.success;
    case 'rejected':
      return Colors.error;
    case 'cancelled':
      return Colors.cancelled;
    default:
      return Colors.outline;
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

export default function MyRequestsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useMyRequests(selectedFilter);

  // Compute summary metrics for stats card
  const metrics = useMemo(() => {
    if (!requests) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    };
  }, [requests]);

  // Filter by search query client-side
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.type.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Welcome Section */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeGreeting}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Employee'}
          </Text>
          <Text style={styles.welcomeSub}>Manage and track your internal requests</Text>
        </View>
        <TouchableOpacity
          style={styles.newRequestBtn}
          onPress={() => router.push('/(tabs)/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stitch Metrics Summary Card */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{metrics.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <View style={[styles.statDot, { backgroundColor: Colors.warning }]} />
            <Text style={[styles.statNumber, { color: Colors.warning }]}>{metrics.pending}</Text>
          </View>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.statNumber, { color: Colors.success }]}>{metrics.approved}</Text>
          </View>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.outline} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests by title or category..."
          placeholderTextColor={Colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.outline} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Segmented Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as FilterType[]).map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.8}
            >
              {filter !== 'all' ? (
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: getStatusAccentColor(filter as RequestStatus) },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }: { item: RequestRow }) => {
    const typeCfg = getTypeConfig(item.type);
    const accentColor = getStatusAccentColor(item.status);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* Left Status Color Accent Bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />

        <View style={styles.cardMain}>
          <View style={styles.cardTopRow}>
            {/* Category Tag */}
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

            <StatusBadge status={item.status} size="sm" />
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
            <View style={styles.leavePeriodPill}>
              <Ionicons name="calendar" size={13} color={Colors.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.leavePeriodText}>
                {item.start_date} → {item.end_date}
              </Text>
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <Text style={styles.submittedDate}>Submitted {formatDate(item.created_at)}</Text>
            <View style={styles.viewDetailLink}>
              <Text style={styles.viewDetailText}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingView message="Loading your requests..." />
      ) : isError ? (
        <ErrorView
          title="Could not load requests"
          message={error?.message || 'Something went wrong while fetching requests.'}
          onRetry={() => {
            refetch();
          }}
        />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyView
              icon="document-text-outline"
              title={selectedFilter === 'all' ? 'No requests yet' : `No ${selectedFilter} requests`}
              description={
                selectedFilter === 'all'
                  ? 'Submit your first leave, equipment, or IT support request.'
                  : `There are currently no requests matching the "${selectedFilter}" status.`
              }
              actionLabel={selectedFilter === 'all' ? 'Submit New Request' : 'Clear Filters'}
              onAction={() => {
                if (selectedFilter === 'all') {
                  router.push('/(tabs)/new');
                } else {
                  setSelectedFilter('all');
                }
              }}
            />
          }
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    padding: 18,
    paddingBottom: 8,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  newRequestBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Shadows.sm,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardAccentBar: {
    width: 4,
  },
  cardMain: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 8,
  },
  leavePeriodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  leavePeriodText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  submittedDate: {
    fontSize: 11,
    color: Colors.outline,
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
