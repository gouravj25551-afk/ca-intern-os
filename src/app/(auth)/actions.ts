'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { loginSchema, setupAdminSchema } from '@/lib/validation';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import {
  setSessionCookie,
  clearSessionCookie,
  userCount,
} from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { ensureKnowledgeSeeded } from '@/lib/knowledge-bootstrap';

export type ActionState = { ok: boolean; error?: string };

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'Please enter a valid email and password.' };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Constant-ish response: same generic message whether user exists or not.
  if (!user || !user.isActive) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  await setSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await logActivity({
    userId: user.id,
    action: 'auth.login',
    entityType: 'User',
    entityId: user.id,
    summary: `${user.name} signed in`,
  });

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  clearSessionCookie();
  redirect('/login');
}

export async function setupAdminAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Only allowed when there are zero users (first-run bootstrap).
  const count = await userCount();
  if (count > 0) {
    return {
      ok: false,
      error: 'An account already exists. Please sign in instead.',
    };
  }

  const parsed = setupAdminSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid details.',
    };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Populate the knowledge base on first run so a fresh deploy is complete
  // without any manual seed step. Idempotent + best-effort.
  await ensureKnowledgeSeeded();

  await setSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await logActivity({
    userId: user.id,
    action: 'auth.setup',
    entityType: 'User',
    entityId: user.id,
    summary: `Admin account created for ${user.name}`,
  });

  redirect('/dashboard');
}
