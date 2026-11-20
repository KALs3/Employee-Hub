import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Shadows } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('alex.employee@company.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'employee' | 'manager'>('employee');

  const handleRoleSelect = (role: 'employee' | 'manager') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'employee') {
      setEmail('alex.employee@company.com');
      setPassword('Password123!');
    } else {
      setEmail('sarah.manager@company.com');
      setPassword('Password123!');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both corporate email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.appIconWrapper}>
            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>Employee Hub</Text>
          <Text style={styles.subtitle}>
            Internal Requests & Approvals • Supabase Auth
          </Text>
        </View>

        {/* Role Switcher Quick-Fill (Stitch Bento Cards) */}
        <View style={styles.roleSection}>
          <View style={styles.roleSectionHeader}>
            <Text style={styles.sectionHeaderTitle}>FAST LOGIN / SANDBOX ROLES</Text>
            <View style={styles.instantFillBadge}>
              <Ionicons name="flash" size={12} color={Colors.secondary} />
              <Text style={styles.instantFillText}>Instant Fill</Text>
            </View>
          </View>

          {/* Employee Role Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'employee' && styles.roleCardActive,
            ]}
            onPress={() => handleRoleSelect('employee')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardLeft}>
              <View
                style={[
                  styles.roleIconCircle,
                  selectedRole === 'employee' && styles.roleIconCircleActive,
                ]}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={selectedRole === 'employee' ? '#FFFFFF' : Colors.primary}
                />
              </View>
              <View style={styles.roleCardText}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleName}>Alex Mercer</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>Requester</Text>
                  </View>
                </View>
                <Text style={styles.roleDesc}>Software Engineer • Engineering</Text>
              </View>
            </View>
            <Ionicons
              name={selectedRole === 'employee' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedRole === 'employee' ? Colors.secondary : Colors.outline}
            />
          </TouchableOpacity>

          {/* Manager Role Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'manager' && styles.roleCardActive,
            ]}
            onPress={() => handleRoleSelect('manager')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardLeft}>
              <View
                style={[
                  styles.roleIconCircle,
                  selectedRole === 'manager' && styles.roleIconCircleActive,
                ]}
              >
                <Ionicons
                  name="shield"
                  size={18}
                  color={selectedRole === 'manager' ? '#FFFFFF' : Colors.primary}
                />
              </View>
              <View style={styles.roleCardText}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleName}>Sarah Connor</Text>
                  <View style={[styles.roleTag, styles.managerTag]}>
                    <Text style={[styles.roleTagText, styles.managerTagText]}>Approver</Text>
                  </View>
                </View>
                <Text style={styles.roleDesc}>Engineering Manager • Lead</Text>
              </View>
            </View>
            <Ionicons
              name={selectedRole === 'manager' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selectedRole === 'manager' ? Colors.secondary : Colors.outline}
            />
          </TouchableOpacity>

          {/* Security Banner */}
          <View style={styles.policyNotice}>
            <Ionicons name="lock-closed" size={14} color={Colors.secondary} />
            <Text style={styles.policyNoticeText}>
              RLS policies strictly enforced by active user role.
            </Text>
          </View>
        </View>

        {/* Credentials Form Card */}
        <View style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Corporate Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="name@company.com"
                placeholderTextColor={Colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.outline}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.outline}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Role Feedback Pill */}
          <View style={styles.feedbackPill}>
            <View style={styles.feedbackDot} />
            <Text style={styles.feedbackText} numberOfLines={1}>
              Active: {selectedRole === 'employee' ? 'Alex Mercer (Employee)' : 'Sarah Connor (Manager)'}
            </Text>
            <Text style={styles.feedbackBadge}>CONFIGURED</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Sign In with Single Sign-On</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Reassurance */}
        <View style={styles.footer}>
          <View style={styles.footerSecurityBadge}>
            <Ionicons name="shield-outline" size={14} color={Colors.primary} />
            <Text style={styles.footerSecurityText}>
              Secured by Supabase Row Level Security (RLS) & JWT
            </Text>
          </View>
          <Text style={styles.footerSubtext}>
            Enterprise grade token management with automated credential revocation.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.md,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  roleSection: {
    marginBottom: 20,
    gap: 8,
  },
  roleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  instantFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  instantFillText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  roleCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: '#F8FAFF',
  },
  roleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleIconCircleActive: {
    backgroundColor: Colors.primary,
  },
  roleCardText: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  roleName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  roleTag: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  managerTag: {
    backgroundColor: Colors.secondaryFixed,
  },
  managerTagText: {
    color: Colors.onSecondaryFixed,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 2,
  },
  policyNoticeText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },
  eyeButton: {
    padding: 4,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 4,
    gap: 6,
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  feedbackText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  feedbackBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  footerSecurityText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'center',
    maxWidth: 280,
  },
});
