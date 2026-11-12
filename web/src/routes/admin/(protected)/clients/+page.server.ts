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
	archived_at: string | null;
	/** Name of the client's active workout, or null without a program. */
	program: string | null;
	/** Check-ins still waiting for coach feedback. */
	pendingCheckIns: number;
	/** Client messages the coach has not opened yet. */
	unreadMessages: number;
	/** Status of the latest assessment, or null if none was taken. */
	assessmentStatus: string | null;
};

export const load: PageServerLoad = async (event) => {
	if (event.locals.localAdminDemo) {
		await requireAdmin(event);
		return { clients: [] as ClientSummary[], loadError: null };
	}

	// Queries run alongside the admin check; RLS still limits what a non-admin could read,
	// and a failed check discards the results.
	const supabase = event.locals.supabase;
	const [, { data, error }, programs, checkIns, assessments, messages] = await Promise.all([
		requireAdmin(event),
		supabase
			.from('client_profiles')
			.select('id, display_name, coaching_mode, created_at, archived_at')
			.order('created_at', { ascending: false }),
		supabase
			.from('client_programs')
			.select('client_id, workout:program_templates!workout_template_id(name)')
			.eq('status', 'active'),
		supabase.from('check_ins').select('client_id').is('coach_feedback', null),
		supabase
			.from('assessments')
			.select('client_id, status')
			.order('created_at', { ascending: false }),
		supabase.from('messages').select('client_id').eq('sender_role', 'client').is('read_at', null)
	]);
	if (error)
		return {
			clients: [] as ClientSummary[],
			loadError: 'Clients could not be loaded. Please try again.'
		};

	// Extras for the list; missing ones just leave the column blank.
	const programOf = new Map<string, string>();
	for (const row of programs.data ?? []) {
		const workout = row.workout as { name?: string } | { name?: string }[] | null;
		const name = Array.isArray(workout) ? workout[0]?.name : workout?.name;
		if (name) programOf.set(row.client_id as string, name);
	}
	const pending = new Map<string, number>();
	for (const row of checkIns.data ?? [])
		pending.set(row.client_id as string, (pending.get(row.client_id as string) ?? 0) + 1);

	const unread = new Map<string, number>();
	for (const row of messages.data ?? [])
		unread.set(row.client_id as string, (unread.get(row.client_id as string) ?? 0) + 1);

	// Newest first, so the first status seen per client is their latest.
	const assessmentOf = new Map<string, string>();
	for (const row of assessments.data ?? [])
		if (!assessmentOf.has(row.client_id as string))
			assessmentOf.set(row.client_id as string, row.status as string);

	return {
		clients: (data ?? []).map((client): ClientSummary => ({
			...client,
			program: programOf.get(client.id) ?? null,
			pendingCheckIns: pending.get(client.id) ?? 0,
			unreadMessages: unread.get(client.id) ?? 0,
			assessmentStatus: assessmentOf.get(client.id) ?? null
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
		return { invited: true, email, resent: result.resent };
	}
} satisfies Actions;
