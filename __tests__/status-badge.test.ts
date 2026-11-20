import { getStatusConfig } from '@/components/status-badge';

describe('Status Badge Configurations', () => {
  it('returns amber styling for pending requests', () => {
    const config = getStatusConfig('pending');
    expect(config.label).toBe('Pending');
    expect(config.text).toBe('#D97706');
    expect(config.bg).toBe('#FEF3C7');
  });

  it('returns green styling for approved requests', () => {
    const config = getStatusConfig('approved');
    expect(config.label).toBe('Approved');
    expect(config.text).toBe('#059669');
    expect(config.bg).toBe('#D1FAE5');
  });

  it('returns red styling for rejected requests', () => {
    const config = getStatusConfig('rejected');
    expect(config.label).toBe('Rejected');
    expect(config.text).toBe('#DC2626');
    expect(config.bg).toBe('#FEE2E2');
  });

  it('returns gray styling for cancelled requests', () => {
    const config = getStatusConfig('cancelled');
    expect(config.label).toBe('Cancelled');
    expect(config.text).toBe('#64748B');
    expect(config.bg).toBe('#F1F5F9');
  });
});
