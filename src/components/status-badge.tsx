import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RequestStatus } from '@/types/database.types';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        bg: '#FEF3C7',
        border: '#FDE68A',
        text: '#D97706',
      };
    case 'approved':
      return {
        label: 'Approved',
        bg: '#D1FAE5',
        border: '#A7F3D0',
        text: '#059669',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bg: '#FEE2E2',
        border: '#FECACA',
        text: '#DC2626',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: '#F1F5F9',
        border: '#E2E8F0',
        text: '#64748B',
      };
    default:
      return {
        label: status,
        bg: '#F1F5F9',
        border: '#E2E8F0',
        text: '#64748B',
      };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        isSm ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSm ? styles.textSm : styles.textMd,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
});
