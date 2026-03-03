import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '$lib/db/index.js';
import { users, otpTokens, sessions } from '$lib/db/schema.js';
import { eq, and, gt, isNull } from 'drizzle-orm';

const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function codeMatches(candidate: string, storedHash: string): boolean {
	const a = Buffer.from(hashCode(candidate), 'hex');
	const b = Buffer.from(storedHash, 'hex');
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------

/** Look up or create a user by email, generate an OTP, persist it, return the code. */
export async function createOtpForEmail(email: string): Promise<string> {
	// Upsert user (insert if not exists)
	await db
		.insert(users)
		.values({ email })
		.onConflictDoNothing();

	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

	// Generate 6-digit code, zero-padded
	const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
	const hash = hashCode(code);
	const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

	await db.insert(otpTokens).values({ userId: user.id, code: hash, expiresAt });

	return code;
}

/** Validate a submitted code for a given email. Returns the user id on success. */
export async function verifyOtp(
	email: string,
	candidate: string
): Promise<{ userId: string } | null> {
	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (!user) return null;

	// Fetch the most-recent unused, unexpired token for this user
	const [token] = await db
		.select()
		.from(otpTokens)
		.where(
			and(
				eq(otpTokens.userId, user.id),
				isNull(otpTokens.usedAt),
				gt(otpTokens.expiresAt, new Date())
			)
		)
		.orderBy(otpTokens.expiresAt)
		.limit(1);

	if (!token || !codeMatches(candidate, token.code)) return null;

	// Mark token as used
	await db
		.update(otpTokens)
		.set({ usedAt: new Date() })
		.where(eq(otpTokens.id, token.id));

	return { userId: user.id };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/** Create a DB session and return its id (used as the cookie value). */
export async function createSession(userId: string): Promise<string> {
	const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

	const [session] = await db
		.insert(sessions)
		.values({ userId, expiresAt })
		.returning({ id: sessions.id });

	return session.id;
}
