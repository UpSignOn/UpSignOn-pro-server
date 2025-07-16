import { isEmailEquivalentTo } from '../emailCompare';

describe('isEmailEquivalentTo', () => {
  describe('Cas basiques', () => {
    test('devrait retourner true pour des emails identiques', () => {
      expect(isEmailEquivalentTo('test@example.com', 'test@example.com')).toBe(true);
    });

    test('devrait retourner false pour des emails différents', () => {
      expect(isEmailEquivalentTo('test@example.com', 'different@example.com')).toBe(false);
    });

    test('devrait retourner false pour des domaines différents', () => {
      expect(isEmailEquivalentTo('test@example.com', 'test@different.com')).toBe(false);
    });
  });

  describe('Normalisation', () => {
    test('devrait ignorer la casse', () => {
      expect(isEmailEquivalentTo('Test@Example.COM', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('TEST@EXAMPLE.COM', 'test@example.com')).toBe(true);
    });

    test('devrait ignorer les espaces en début et fin', () => {
      expect(isEmailEquivalentTo('  test@example.com  ', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('test@example.com', '  test@example.com  ')).toBe(true);
      expect(isEmailEquivalentTo('  test@example.com  ', '  test@example.com  ')).toBe(true);
    });

    test('devrait combiner normalisation de casse et espaces', () => {
      expect(isEmailEquivalentTo('  Test@Example.COM  ', 'test@example.com')).toBe(true);
    });
  });

  describe('Extensions email (partie + dans la partie locale)', () => {
    test('devrait traiter les extensions email comme équivalentes', () => {
      expect(isEmailEquivalentTo('test+extension@example.com', 'test@example.com')).toBe(true);
      expect(isEmailEquivalentTo('test@example.com', 'test+extension@example.com')).toBe(true);
    });

    test('devrait traiter différentes extensions comme équivalentes', () => {
      expect(isEmailEquivalentTo('test+work@example.com', 'test+personal@example.com')).toBe(true);
    });

    test('devrait traiter les extensions multiples', () => {
      expect(isEmailEquivalentTo('test+work+backup@example.com', 'test@example.com')).toBe(true);
      expect(
        isEmailEquivalentTo('test+work+backup@example.com', 'test+different@example.com'),
      ).toBe(true);
    });

    test('devrait gérer les extensions avec normalisation', () => {
      expect(isEmailEquivalentTo('  Test+EXTENSION@Example.COM  ', 'test@example.com')).toBe(true);
    });
  });

  describe('Cas limites', () => {
    test('devrait gérer les emails sans domaine', () => {
      expect(isEmailEquivalentTo('test', 'test')).toBe(true);
      expect(isEmailEquivalentTo('test', 'different')).toBe(false);
    });

    test('devrait gérer les emails avec @ mais sans domaine', () => {
      expect(isEmailEquivalentTo('test@', 'test@')).toBe(true);
      expect(isEmailEquivalentTo('test@', 'different@')).toBe(false);
    });

    test('devrait gérer les emails avec + mais sans @ (cas invalide)', () => {
      expect(isEmailEquivalentTo('test+extension', 'test+extension')).toBe(true);
      expect(isEmailEquivalentTo('test+extension', 'test+different')).toBe(false);
    });

    test('devrait gérer les chaînes vides', () => {
      expect(isEmailEquivalentTo('', '')).toBe(true);
      expect(isEmailEquivalentTo('', 'test@example.com')).toBe(false);
      expect(isEmailEquivalentTo('test@example.com', '')).toBe(false);
    });

    test('devrait gérer les espaces uniquement', () => {
      expect(isEmailEquivalentTo('   ', '   ')).toBe(true);
      expect(isEmailEquivalentTo('   ', '')).toBe(true); // Les espaces sont trimés, donc '   ' devient ''
    });
  });

  describe("Cas réels d'usage", () => {
    test('devrait gérer les adresses Gmail avec extensions', () => {
      expect(isEmailEquivalentTo('john.doe+work@gmail.com', 'john.doe@gmail.com')).toBe(true);
      expect(
        isEmailEquivalentTo('john.doe+newsletters@gmail.com', 'john.doe+shopping@gmail.com'),
      ).toBe(true);
    });

    test('devrait gérer les adresses corporatives avec extensions', () => {
      expect(isEmailEquivalentTo('employee+department@company.com', 'employee@company.com')).toBe(
        true,
      );
    });

    test('devrait différencier les utilisateurs différents même avec extensions', () => {
      expect(isEmailEquivalentTo('john+work@company.com', 'jane+work@company.com')).toBe(false);
    });

    test('devrait gérer les adresses avec points dans la partie locale', () => {
      expect(isEmailEquivalentTo('john.doe+work@example.com', 'john.doe@example.com')).toBe(true);
    });
  });
});
