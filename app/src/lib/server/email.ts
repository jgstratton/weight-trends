import sgMail from '@sendgrid/mail';
import { env } from '$env/dynamic/private';

export function sendOtpEmail(to: string, code: string): Promise<void> {
	const apiKey = env.SENDGRID_API_KEY;
	const from = env.SENDGRID_FROM_EMAIL;

	if (!apiKey || !from) {
		throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must be set in the environment.');
	}

	sgMail.setApiKey(apiKey);

	return sgMail
		.send({
			to,
			from,
			subject: 'Your Weight Trends login code',
			text: `Your one-time login code is: ${code}\n\nThis code expires in 10 minutes.`,
			html: `<p>Your one-time login code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`
		})
		.then(() => undefined);
}
