import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { inviteClient, validInviteEmail } from '$lib/server/auth/invites';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { assignProgram } from '$lib/server/coaching/templates';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	if (event.locals.localAdminDemo)
		return { clients: [], workoutTemplates: [], nutritionTemplates: [], loadError: null };

	const { data, error } = await event.locals.supabase
		.from('client_profiles')
		.select('id, display_name, coaching_mode, created_at')
		.order('created_at', { ascending: false });
	if (error)
		return {
			clients: [],
			workoutTemplates: [],
			nutritionTemplates: [],
			loadError: 'Clients could not be loaded. Please try again.'
		};

	// Only active (non-archived) templates can be assigned.
	const { data: templates } = await event.locals.supabase
		.from('program_templates')
		.select('id, kind, name')
		.eq('is_archived', false)
		.order('name');
	const active = templates ?? [];
	return {
		clients: data ?? [],
		workoutTemplates: active.filter((template) => template.kind === 'workout'),
		nutritionTemplates: active.filter((template) => template.kind === 'nutrition'),
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
	},
	assign: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		if (event.locals.localAdminDemo)
			return fail(400, { assignMessage: 'Programs cannot be assigned in the local demo.' });

		const form = await event.request.formData();
		const clientId = String(form.get('client_id') ?? '');
		const workoutId = String(form.get('workout_template_id') ?? '');
		const nutritionId = String(form.get('nutrition_template_id') ?? '') || null;
		if (!clientId || !workoutId)
			return fail(400, { assignMessage: 'Choose a client and a workout template.' });

		const result = await assignProgram(event.locals.supabase, clientId, workoutId, nutritionId);
		if (!result.ok) return fail(400, { assignMessage: result.message });
		return { assigned: true };
	}
} satisfies Actions;
