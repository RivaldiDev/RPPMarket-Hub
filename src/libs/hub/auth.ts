import { auth } from '@clerk/nextjs/server';
import { Env } from '@/libs/Env';

/**
 * Require a signed-in Clerk user id (server-side).
 * Throws if unauthenticated.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('unauthorized');
  }
  return userId;
}

/**
 * Platform admins from comma-separated PLATFORM_ADMIN_USER_IDS env.
 */
export function isPlatformAdmin(userId: string): boolean {
  if (!userId?.trim()) {
    return false;
  }
  const raw = Env.PLATFORM_ADMIN_USER_IDS ?? '';
  if (!raw.trim()) {
    return false;
  }
  const ids = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}
