import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '$env/static/private';

export async function sendOtpEmail(to: string, code: string): Promise<void> {
	if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
		throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL must be set in the environment.');
	}

	const resend = new Resend(RESEND_API_KEY);

	const { error } = await resend.emails.send({
		from: RESEND_FROM_EMAIL,
		to,
		subject: 'Your Weight Trends login code',
		text: `Your one-time login code is: ${code}\n\nThis code expires in 10 minutes.`,
		html: `<p>Your one-time login code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`
	});

	if (error) {
		throw new Error(`Resend error: ${error.message}`);
	}
}
