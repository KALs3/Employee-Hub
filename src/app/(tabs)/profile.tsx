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

export default function ProfileScreen() {
  const { profile, manager, signOut, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Header Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {profile?.role ? profile.role.toUpperCase() : 'EMPLOYEE'}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Employee Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="business-outline" size={20} color="#64748B" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{profile?.department || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="person-circle-outline" size={20} color="#64748B" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Reporting Manager</Text>
            <Text style={styles.infoValue}>
              {manager?.full_name || (profile?.role === 'manager' ? 'None (Lead)' : 'Not assigned')}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => signOut()}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});
