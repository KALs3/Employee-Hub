import { z } from 'zod';
import { RequestType } from '@/types/database.types';

export const requestTypeOptions: { label: string; value: RequestType; description: string }[] = [
  { label: 'Leave', value: 'leave', description: 'Vacation, sick leave, or personal time off' },
  { label: 'Equipment', value: 'equipment', description: 'Laptops, monitors, peripherals, or office tools' },
  { label: 'IT Support', value: 'it_support', description: 'Account access, VPN, software licenses, or technical help' },
];

export const createRequestSchema = z
  .object({
    type: z.enum(['leave', 'equipment', 'it_support']),
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z.string().max(1000, 'Description is too long').optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'leave') {
      if (!data.start_date || data.start_date.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start_date'],
          message: 'Start date is required for leave requests',
        });
      }
      if (!data.end_date || data.end_date.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: 'End date is required for leave requests',
        });
      }
      if (data.start_date && data.end_date && data.end_date < data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: 'End date cannot be earlier than start date',
        });
      }
    }
  });

export type CreateRequestFormValues = z.infer<typeof createRequestSchema>;

export const decisionSchema = z
  .object({
    decision: z.enum(['approved', 'rejected'] as const),
    comment: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'rejected' && (!data.comment || data.comment.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['comment'],
        message: 'A comment explaining the reason is required for rejection',
      });
    }
  });

export type DecisionFormValues = z.infer<typeof decisionSchema>;
