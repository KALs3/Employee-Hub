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
  requestTypeOptions,
} from '@/lib/validation';
import { useCreateRequest } from '@/hooks/use-requests';
import { RequestType } from '@/types/database.types';

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

  const onSubmit = async (data: CreateRequestFormValues) => {
    setSubmitError(null);
    try {
      const created = await createMutation.mutateAsync(data);
      reset();
      // Navigate to the created request's detail page
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
      >
        <Text style={styles.headerTitle}>Create a Request</Text>
        <Text style={styles.headerSubtitle}>
          Submit an internal request to your direct manager for review
        </Text>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        {/* 1. Request Type Selector */}
        <Text style={styles.sectionLabel}>Request Category</Text>
        <View style={styles.typeSelectorContainer}>
          {requestTypeOptions.map((opt) => {
            const isSelected = selectedType === opt.value;
            let icon: keyof typeof Ionicons.glyphMap = 'document-outline';
            if (opt.value === 'leave') icon = 'calendar';
            if (opt.value === 'equipment') icon = 'laptop';
            if (opt.value === 'it_support') icon = 'hardware-chip';

            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeOptionCard, isSelected && styles.typeOptionSelected]}
                onPress={() => setValue('type', opt.value as RequestType, { shouldValidate: true })}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIconBox, isSelected && styles.typeIconBoxSelected]}>
                  <Ionicons name={icon} size={20} color={isSelected ? '#FFFFFF' : '#475569'} />
                </View>
                <View style={styles.typeTextGroup}>
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.typeDescription} numberOfLines={2}>
                    {opt.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.type?.message ? (
          <Text style={styles.inlineError}>{errors.type.message}</Text>
        ) : null}

        {/* 2. Title Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Request Title <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Annual Vacation, Second Monitor, VPN setup"
                placeholderTextColor="#94A3B8"
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

        {/* 3. Conditional Date Fields for Leave */}
        {selectedType === 'leave' ? (
          <View style={styles.dateSection}>
            <Text style={styles.label}>
              Leave Period (YYYY-MM-DD) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.subLabel}>Start Date</Text>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.start_date && styles.inputError]}
                      placeholder="2026-12-01"
                      placeholderTextColor="#94A3B8"
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
                <Text style={styles.subLabel}>End Date</Text>
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.end_date && styles.inputError]}
                      placeholder="2026-12-08"
                      placeholderTextColor="#94A3B8"
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

        {/* 4. Description Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description / Justification (Optional)</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add context or notes for your manager to review..."
                placeholderTextColor="#94A3B8"
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
          activeOpacity={0.8}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  typeSelectorContainer: {
    gap: 10,
    marginBottom: 16,
  },
  typeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  typeOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconBoxSelected: {
    backgroundColor: '#2563EB',
  },
  typeTextGroup: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: '#1D4ED8',
  },
  typeDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inlineError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  dateSection: {
    marginBottom: 18,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
