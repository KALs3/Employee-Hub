import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const { profile, manager, signOut, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isManager = profile?.role === 'manager';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* User Hero Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Corporate User'}</Text>
        <View style={[styles.roleBadge, isManager ? styles.managerBadge : styles.employeeBadge]}>
          <Text style={[styles.roleText, isManager ? styles.managerText : styles.employeeText]}>
            {isManager ? 'TEAM MANAGER' : 'EMPLOYEE'}
          </Text>
        </View>
      </View>

      {/* Corporate Position Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ORGANIZATION DETAILS</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="business-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{profile?.department || 'Engineering'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Reporting Manager</Text>
            <Text style={styles.infoValue}>
              {manager?.full_name || (isManager ? 'Department Head' : 'Not assigned')}
            </Text>
          </View>
        </View>
      </View>

      {/* Security & System Architecture Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>SECURITY & ARCHITECTURE</Text>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.successContainer }]}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Row Level Security</Text>
            <Text style={styles.infoValue}>Enforced on Postgres Database</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.surfaceContainer }]}>
            <Ionicons name="key-outline" size={18} color={Colors.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Session Storage</Text>
            <Text style={styles.infoValue}>Expo SecureStore (Encrypted)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.surfaceContainer }]}>
            <Ionicons name="git-branch-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Application Stack</Text>
            <Text style={styles.infoValue}>Expo SDK 58 • React Native 0.88</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => signOut()}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out from Device</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    ...Shadows.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  employeeBadge: {
    backgroundColor: Colors.surfaceContainer,
    borderColor: '#C7D2FE',
  },
  employeeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  managerBadge: {
    backgroundColor: Colors.secondaryFixed,
    borderColor: '#BFDBFE',
  },
  managerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorContainer,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
});
