import { isEmailEquivalentTo } from '../emailCompare';

describe('isEmailEquivalentTo', () => {
  describe('Basic cases', () => {
    test('should return true for identical emails', () => {
      expect(isEmailEquivalentTo('test@example.com', 'test@example.com')).toBe(true);
    });

    test('should return false for different emails', () => {
      expect(isEmailEquivalentTo('test@example.com', 'different@example.com')).toBe(false);
    });

    test('should return false for different domains', () => {
      expect(isEmailEquivalentTo('test@example.com', 'test@different.com')).toBe(false);
    });
  });

  describe('Normalization', () => {
    test('should ignore case', () => {
      expect(isEmailEquivalentTo('Test@Example.COM', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('TEST@EXAMPLE.COM', 'test@example.com')).toBe(true);
    });

    test('should ignore leading and trailing spaces', () => {
      expect(isEmailEquivalentTo('  test@example.com  ', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('test@example.com', '  test@example.com  ')).toBe(true);
      expect(isEmailEquivalentTo('  test@example.com  ', '  test@example.com  ')).toBe(true);
    });

    test('should combine case and space normalization', () => {
      expect(isEmailEquivalentTo('  Test@Example.COM  ', 'test@example.com')).toBe(true);
    });
  });

  describe('Email extensions (+ part in local part)', () => {
    test('should treat email extensions as equivalent', () => {
      expect(isEmailEquivalentTo('test+extension@example.com', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('test@example.com', 'test+extension@example.com')).toBe(true);
    });

    test('should treat different extensions as equivalent', () => {
      expect(isEmailEquivalentTo('test+work@example.com', 'test+personal@example.com')).toBe(true);
    });

    test('should handle multiple extensions', () => {
      expect(isEmailEquivalentTo('test+work+backup@example.com', 'test@example.com')).toBe(true);
      expect(
        isEmailEquivalentTo('test+work+backup@example.com', 'test+different@example.com'),
      ).toBe(true);
    });

    test('should handle extensions with normalization', () => {
      expect(isEmailEquivalentTo('  Test+EXTENSION@Example.COM  ', 'test@example.com')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle emails without domain', () => {
      expect(isEmailEquivalentTo('test', 'test')).toBe(true);
      expect(isEmailEquivalentTo('test', 'different')).toBe(false);
    });

    test('should handle emails with @ but no domain', () => {
      expect(isEmailEquivalentTo('test@', 'test@')).toBe(true);
      expect(isEmailEquivalentTo('test@', 'different@')).toBe(false);
    });

    test('should handle emails with + but no @ (invalid case)', () => {
      expect(isEmailEquivalentTo('test+extension', 'test+extension')).toBe(true);
      expect(isEmailEquivalentTo('test+extension', 'test+different')).toBe(false);
    });

    test('should handle empty strings', () => {
      expect(isEmailEquivalentTo('', '')).toBe(true);
      expect(isEmailEquivalentTo('', 'test@example.com')).toBe(false);
      expect(isEmailEquivalentTo('test@example.com', '')).toBe(false);
    });

    test('should handle spaces only', () => {
      expect(isEmailEquivalentTo('   ', '   ')).toBe(true);
      expect(isEmailEquivalentTo('   ', '')).toBe(true); // Spaces are trimmed, so '   ' becomes ''
    });
  });

  describe('Real-world use cases', () => {
    test('should handle Gmail addresses with extensions', () => {
      expect(isEmailEquivalentTo('john.doe+work@gmail.com', 'john.doe@gmail.com')).toBe(true);
      expect(
        isEmailEquivalentTo('john.doe+newsletters@gmail.com', 'john.doe+shopping@gmail.com'),
      ).toBe(true);
    });

    test('should handle corporate addresses with extensions', () => {
      expect(isEmailEquivalentTo('employee+department@company.com', 'employee@company.com')).toBe(
        true,
      );
    });

    test('should differentiate different users even with extensions', () => {
      expect(isEmailEquivalentTo('john+work@company.com', 'jane+work@company.com')).toBe(false);
    });

    test('should handle addresses with dots in local part', () => {
      expect(isEmailEquivalentTo('john.doe+work@example.com', 'john.doe@example.com')).toBe(true);
    });
  });
});
