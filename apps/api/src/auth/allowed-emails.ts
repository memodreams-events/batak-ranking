const DEFAULT_ALLOWED = 'info@memodreams.com';

/** Correos autorizados a entrar, en minúsculas. Configurable con ALLOWED_EMAILS (separados por comas). */
export function allowedEmails(): string[] {
  const raw = (process.env.ALLOWED_EMAILS ?? '').trim() || DEFAULT_ALLOWED;
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.trim().toLowerCase());
}
