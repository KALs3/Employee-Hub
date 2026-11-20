import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RequestStatus } from '@/types/database.types';
import { Colors } from '@/constants/theme';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        bg: Colors.warningContainer,
        border: '#FDE68A',
        text: Colors.warning,
        icon: 'time-outline' as const,
      };
    case 'approved':
      return {
        label: 'Approved',
        bg: Colors.successContainer,
        border: '#A7F3D0',
        text: Colors.success,
        icon: 'checkmark-circle-outline' as const,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bg: '#FEE2E2',
        border: '#FECACA',
        text: Colors.error,
        icon: 'close-circle-outline' as const,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: Colors.cancelledContainer,
        border: '#E2E8F0',
        text: Colors.cancelled,
        icon: 'ban-outline' as const,
      };
    default:
      return {
        label: status,
        bg: Colors.cancelledContainer,
        border: '#E2E8F0',
        text: Colors.cancelled,
        icon: 'ellipse-outline' as const,
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
      <Ionicons
        name={config.icon}
        size={isSm ? 12 : 14}
        color={config.text}
        style={{ marginRight: 4 }}
      />
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
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
});
