import { allowedEmails, isAllowed } from './allowed-emails';

describe('allowed-emails', () => {
  const original = process.env.ALLOWED_EMAILS;
  afterEach(() => {
    if (original === undefined) delete process.env.ALLOWED_EMAILS;
    else process.env.ALLOWED_EMAILS = original;
  });

  it('por defecto solo autoriza info@memodreams.com', () => {
    delete process.env.ALLOWED_EMAILS;
    expect(allowedEmails()).toEqual(['info@memodreams.com']);
    expect(isAllowed('info@memodreams.com')).toBe(true);
    expect(isAllowed('otro@memodreams.com')).toBe(false);
  });

  it('ignora mayúsculas y espacios', () => {
    delete process.env.ALLOWED_EMAILS;
    expect(isAllowed('  INFO@MemoDreams.com ')).toBe(true);
  });

  it('rechaza un correo vacío o ausente', () => {
    expect(isAllowed(null)).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
    expect(isAllowed('')).toBe(false);
  });

  it('admite varios correos separados por comas', () => {
    process.env.ALLOWED_EMAILS = 'uno@memodreams.com, dos@memodreams.com';
    expect(isAllowed('dos@memodreams.com')).toBe(true);
    expect(isAllowed('tres@memodreams.com')).toBe(false);
  });

  it('con la variable vacía vuelve al valor por defecto, no a barra libre', () => {
    process.env.ALLOWED_EMAILS = '   ';
    expect(allowedEmails()).toEqual(['info@memodreams.com']);
    expect(isAllowed('cualquiera@ejemplo.com')).toBe(false);
  });
});
