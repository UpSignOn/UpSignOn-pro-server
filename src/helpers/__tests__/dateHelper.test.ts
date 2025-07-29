import { getRemainingDays } from '../dateHelper';

describe('getRemainingDays', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test('should return positive days for future dates', () => {
    // Mock current date to 2025-07-29
    const mockDate = new Date('2025-07-01T10:00:00Z');
    jest.setSystemTime(mockDate);

    const futureDate = '2025-07-08'; // 7 days in the future
    const result = getRemainingDays(futureDate);

    expect(result).toBe(7);
  });

  test('should return 0 for today', () => {
    // Mock current date to 2025-07-29
    const mockDate = new Date('2025-07-29T10:00:00Z');
    jest.setSystemTime(mockDate);

    const todayDate = '2025-07-29';
    const result = getRemainingDays(todayDate);

    expect(result).toBe(0);
  });

  test('should return negative days for past dates', () => {
    // Mock current date to 2025-07-29
    const mockDate = new Date('2025-07-29T10:00:00Z');
    jest.setSystemTime(mockDate);

    const pastDate = '2025-07-25'; // 4 days ago
    const result = getRemainingDays(pastDate);

    expect(result).toBe(-4);
  });

  test('should handle ISO date strings', () => {
    // Mock current date to 2025-07-29
    const mockDate = new Date('2025-07-29T10:00:00Z');
    jest.setSystemTime(mockDate);

    const isoDate = '2025-08-01T15:30:00Z'; // 3 days in the future
    const result = getRemainingDays(isoDate);

    expect(result).toBe(3);
  });

  test('should handle edge case of very close dates around midnight', () => {
    // Mock current date to 2025-07-29
    const mockDate = new Date('2025-07-29T23:59:59Z');
    jest.setSystemTime(mockDate);

    const nextDay = '2025-07-30T15:30:00Z';
    const result = getRemainingDays(nextDay);

    expect(result).toBe(1);
  });

  test('should handle edge case: exactly 1 day difference', () => {
    // Mock current date to 2025-07-29 at midnight
    const mockDate = new Date('2025-07-29T00:00:00Z');
    jest.setSystemTime(mockDate);

    const tomorrow = '2025-07-30';
    const result = getRemainingDays(tomorrow);

    expect(result).toBe(1);
  });

  test('should handle leap year calculations', () => {
    // Mock current date to Feb 28, 2024 (leap year)
    const mockDate = new Date('2024-02-28T10:00:00Z');
    jest.setSystemTime(mockDate);

    const leapDay = '2024-02-29';
    const result = getRemainingDays(leapDay);

    expect(result).toBe(1);
  });
});
