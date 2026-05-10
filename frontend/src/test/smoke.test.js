import { describe, it, expect } from 'vitest';

describe('Smoke tests', () => {
  it('should load queryClient configuration', async () => {
    const { queryClient } = await import('../lib/queryClient');
    expect(queryClient).toBeDefined();
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries.staleTime).toBe(5 * 60 * 1000);
  });

  it('should load i18n with Arabic, English, and French', async () => {
    const { default: i18n } = await import('../lib/i18n');
    expect(i18n.languages).toContain('ar');
    expect(i18n.options.resources).toHaveProperty('en');
    expect(i18n.options.resources).toHaveProperty('fr');
  });

  it('should have correct translation keys', async () => {
    const { default: i18n } = await import('../lib/i18n');
    await i18n.changeLanguage('en');
    expect(i18n.t('common.save')).toBe('Save');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe('Enregistrer');
    await i18n.changeLanguage('ar');
    expect(i18n.t('common.save')).toBe('حفظ');
  });
});
