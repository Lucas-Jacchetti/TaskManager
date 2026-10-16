import { normalizeEmail, trim } from './string.transformer';

describe('string.transformer', () => {
  it('trim remove os espaços das pontas', () => {
    expect(trim({ value: '  Lucas  ' })).toBe('Lucas');
  });

  it('normalizeEmail remove espaços e converte para minúsculas', () => {
    expect(normalizeEmail({ value: '  Lucas@Exemplo.COM ' })).toBe(
      'lucas@exemplo.com',
    );
  });

  it('não altera valores que não são texto', () => {
    expect(trim({ value: 10 })).toBe(10);
    expect(normalizeEmail({ value: undefined })).toBeUndefined();
  });
});