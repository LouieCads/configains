import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { inviteClient, validInviteEmail } from '$lib/server/auth/invites';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

type ClientSummary = {
	id: string;
	display_name: string | null;
	coaching_mode: string;
	created_at: string;
	/** Name of the client's active workout, or null without a program. */
	program: string | null;
	/** Check-ins still waiting for coach feedback. */
	pendingCheckIns: number;
};

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	if (event.locals.localAdminDemo) return { clients: [] as ClientSummary[], loadError: null };

	const supabase = event.locals.supabase;
	const { data, error } = await supabase
		.from('client_profiles')
		.select('id, display_name, coaching_mode, created_at')
		.order('created_at', { ascending: false });
	if (error)
		return {
			clients: [] as ClientSummary[],
			loadError: 'Clients could not be loaded. Please try again.'
		};

	// Extras for the list; missing ones just leave the column blank.
	const [programs, checkIns] = await Promise.all([
		supabase
			.from('client_programs')
			.select('client_id, workout:program_templates!workout_template_id(name)')
			.eq('status', 'active'),
		supabase.from('check_ins').select('client_id').is('coach_feedback', null)
	]);
	const programOf = new Map<string, string>();
	for (const row of programs.data ?? []) {
		const workout = row.workout as { name?: string } | { name?: string }[] | null;
		const name = Array.isArray(workout) ? workout[0]?.name : workout?.name;
		if (name) programOf.set(row.client_id as string, name);
	}
	const pending = new Map<string, number>();
	for (const row of checkIns.data ?? [])
		pending.set(row.client_id as string, (pending.get(row.client_id as string) ?? 0) + 1);

	return {
		clients: (data ?? []).map((client): ClientSummary => ({
			...client,
			program: programOf.get(client.id) ?? null,
			pendingCheckIns: pending.get(client.id) ?? 0
		})),
		loadError: null
	};
};

export const actions = {
	invite: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		if (event.locals.localAdminDemo)
			return fail(400, { message: 'Invitations cannot be sent in the local demo.' });

		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').trim();
		const displayName =
			String(form.get('display_name') ?? '')
				.trim()
				.slice(0, 120) || null;
		if (!validInviteEmail(email))
			return fail(400, { message: 'Enter a valid email address.', email, displayName });

		let admin;
		try {
			admin = createServiceClient();
		} catch {
			return fail(503, {
				message: 'Invitations are not set up yet. Add the service-role secret in Netlify.',
				email,
				displayName
			});
		}

		const result = await inviteClient({
			admin,
			coach: event.locals.supabase,
			email,
			displayName,
			redirectTo: new URL('/account/accept-invite', event.url.origin).href
		});
		if (!result.ok) return fail(400, { message: result.message, email, displayName });
		return { invited: true, email };
	}
} satisfies Actions;
