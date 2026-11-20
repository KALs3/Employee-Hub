import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyRequests } from '@/hooks/use-requests';
import { RequestStatus } from '@/types/database.types';
import { StatusBadge } from '@/components/status-badge';
import { LoadingView, EmptyView, ErrorView } from '@/components/feedback-states';
import { RequestRow } from '@/api/requests';

type FilterType = RequestStatus | 'all';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

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

export default function MyRequestsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { data: requests, isLoading, isError, error, refetch, isRefetching } = useMyRequests(selectedFilter);

  const renderItem = ({ item }: { item: RequestRow }) => {
    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeTag}>
            <Ionicons name={getTypeIcon(item.type)} size={14} color="#475569" style={{ marginRight: 4 }} />
            <Text style={styles.typeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
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
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>
              {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.createdDate}>Submitted {formatDate(item.created_at)}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Horizontal Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => {
            const isActive = selectedFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingView message="Loading your requests..." />
      ) : isError ? (
        <ErrorView
          title="Could not load requests"
          message={error?.message || 'Something went wrong while fetching requests.'}
          onRetry={() => refetch()}
        />
      ) : !requests || requests.length === 0 ? (
        <EmptyView
          icon="folder-open-outline"
          title={selectedFilter === 'all' ? 'No requests yet' : `No ${selectedFilter} requests`}
          description={
            selectedFilter === 'all'
              ? 'You have not submitted any internal requests yet. Create your first request anytime!'
              : `There are currently no requests matching the "${selectedFilter}" status.`
          }
          actionLabel={selectedFilter === 'all' ? 'Create a Request' : 'Clear Filter'}
          onAction={() => {
            if (selectedFilter === 'all') {
              router.push('/(tabs)/new');
            } else {
              setSelectedFilter('all');
            }
          }}
        />
      ) : (
        <FlatList
          data={requests}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 10,
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
    letterSpacing: 0.3,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  createdDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
