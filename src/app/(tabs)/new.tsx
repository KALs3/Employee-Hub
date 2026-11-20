import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createRequestSchema,
  CreateRequestFormValues,
} from '@/lib/validation';
import { useCreateRequest } from '@/hooks/use-requests';
import { RequestType } from '@/types/database.types';
import { Colors, Shadows } from '@/constants/theme';

const CATEGORIES: {
  value: RequestType;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'leave',
    title: 'Leave & PTO',
    desc: 'Annual vacation, sick leave, or personal time off',
    icon: 'calendar',
  },
  {
    value: 'equipment',
    title: 'Work Equipment',
    desc: 'Laptops, monitors, ergonomic gear, or accessories',
    icon: 'laptop',
  },
  {
    value: 'it_support',
    title: 'IT Support & Access',
    desc: 'VPN credentials, system permissions, license requests',
    icon: 'hardware-chip',
  },
];

export default function NewRequestScreen() {
  const router = useRouter();
  const createMutation = useCreateRequest();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      type: 'leave',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
    },
  });

  const selectedType = watch('type');
  const watchedTitle = watch('title') || '';
  const watchedDesc = watch('description') || '';

  const onSubmit = async (data: CreateRequestFormValues) => {
    setSubmitError(null);
    try {
      const created = await createMutation.mutateAsync(data);
      reset();
      router.push(`/request/${created.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit request. Please try again.');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Submit a Request</Text>
          <Text style={styles.headerSubtitle}>
            Routing directly to your line manager for review and decision
          </Text>
        </View>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        {/* 1. Category Selection Cards */}
        <Text style={styles.sectionTitle}>SELECT REQUEST TYPE</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedType === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                onPress={() => setValue('type', cat.value, { shouldValidate: true })}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isSelected && styles.categoryIconCircleActive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : Colors.primary}
                  />
                </View>
                <View style={styles.categoryTextCol}>
                  <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleActive]}>
                    {cat.title}
                  </Text>
                  <Text style={styles.categoryDesc}>{cat.desc}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isSelected ? Colors.secondary : Colors.outlineVariant}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Request Title */}
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Request Title</Text>
            <Text style={styles.charCount}>{watchedTitle.length}/120</Text>
          </View>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Q4 Annual Vacation, Keychron Keyboard"
                placeholderTextColor={Colors.outline}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                maxLength={120}
              />
            )}
          />
          {errors.title?.message ? (
            <Text style={styles.inlineError}>{errors.title.message}</Text>
          ) : null}
        </View>

        {/* 3. Conditional Dates for Leave */}
        {selectedType === 'leave' ? (
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Leave Period (YYYY-MM-DD)</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.subDateLabel}>Start Date</Text>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.start_date && styles.inputError]}
                      placeholder="2026-12-01"
                      placeholderTextColor={Colors.outline}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.start_date?.message ? (
                  <Text style={styles.inlineError}>{errors.start_date.message}</Text>
                ) : null}
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.subDateLabel}>End Date</Text>
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.end_date && styles.inputError]}
                      placeholder="2026-12-08"
                      placeholderTextColor={Colors.outline}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.end_date?.message ? (
                  <Text style={styles.inlineError}>{errors.end_date.message}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {/* 4. Description / Justification */}
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Details & Justification</Text>
            <Text style={styles.charCount}>{watchedDesc.length}/1000</Text>
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add necessary notes or context for your manager..."
                placeholderTextColor={Colors.outline}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                maxLength={1000}
              />
            )}
          />
          {errors.description?.message ? (
            <Text style={styles.inlineError}>{errors.description.message}</Text>
          ) : null}
        </View>

        {/* 5. Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
          onPress={() => handleSubmit(onSubmit)()}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request to Manager</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
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
    padding: 18,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  categoryContainer: {
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  categoryCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: '#F8FAFF',
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconCircleActive: {
    backgroundColor: Colors.primary,
  },
  categoryTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  categoryTitleActive: {
    color: Colors.primary,
  },
  categoryDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...Shadows.sm,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  charCount: {
    fontSize: 11,
    color: Colors.outline,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Colors.onSurface,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inlineError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  dateCol: {
    flex: 1,
  },
  subDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  submitButton: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    ...Shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
