// Centralised, validated access to server-side environment variables.
// Throwing early gives a clear error instead of a confusing runtime failure.

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  get AUTH_SECRET(): string {
    return required('AUTH_SECRET', process.env.AUTH_SECRET);
  },
  get SESSION_MAX_AGE(): number {
    const raw = process.env.SESSION_MAX_AGE;
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 8; // 8h default
  },
  get ADMIN_EMAIL(): string | undefined {
    return process.env.ADMIN_EMAIL;
  },
  get ADMIN_PASSWORD(): string | undefined {
    return process.env.ADMIN_PASSWORD;
  },
  get ADMIN_NAME(): string | undefined {
    return process.env.ADMIN_NAME;
  },
};
