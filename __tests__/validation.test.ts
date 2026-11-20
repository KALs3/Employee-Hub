import { createRequestSchema, decisionSchema } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('createRequestSchema', () => {
    it('accepts a valid leave request with start and end dates', () => {
      const validLeave = {
        type: 'leave',
        title: 'Summer Vacation',
        description: 'Going to the beach with family',
        start_date: '2026-07-01',
        end_date: '2026-07-10',
      };
      const result = createRequestSchema.safeParse(validLeave);
      expect(result.success).toBe(true);
    });

    it('rejects leave request if start_date is missing', () => {
      const invalidLeave = {
        type: 'leave',
        title: 'Summer Vacation',
        start_date: '',
        end_date: '2026-07-10',
      };
      const result = createRequestSchema.safeParse(invalidLeave);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('start_date'))).toBe(true);
      }
    });

    it('rejects leave request if end_date is earlier than start_date', () => {
      const invalidLeave = {
        type: 'leave',
        title: 'Summer Vacation',
        start_date: '2026-07-10',
        end_date: '2026-07-01',
      };
      const result = createRequestSchema.safeParse(invalidLeave);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('earlier than start date'))).toBe(true);
      }
    });

    it('accepts valid equipment request without date fields', () => {
      const validEquipment = {
        type: 'equipment',
        title: 'Ergonomic Chair',
        description: 'Need better back support for WFH',
      };
      const result = createRequestSchema.safeParse(validEquipment);
      expect(result.success).toBe(true);
    });

    it('rejects request with title shorter than 3 characters', () => {
      const tooShort = {
        type: 'it_support',
        title: 'Hi',
      };
      const result = createRequestSchema.safeParse(tooShort);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true);
      }
    });
  });

  describe('decisionSchema', () => {
    it('accepts approval without a comment', () => {
      const validApproval = {
        decision: 'approved',
        comment: '',
      };
      const result = decisionSchema.safeParse(validApproval);
      expect(result.success).toBe(true);
    });

    it('rejects rejection if comment is empty or whitespace', () => {
      const invalidRejection = {
        decision: 'rejected',
        comment: '   ',
      };
      const result = decisionSchema.safeParse(invalidRejection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('comment'))).toBe(true);
      }
    });

    it('accepts rejection with a valid explanatory comment', () => {
      const validRejection = {
        decision: 'rejected',
        comment: 'Budget cap exceeded for this quarter',
      };
      const result = decisionSchema.safeParse(validRejection);
      expect(result.success).toBe(true);
    });
  });
});
