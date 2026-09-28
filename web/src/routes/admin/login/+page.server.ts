import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (user) redirect(303, '/admin/dashboard');
};

export const actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		if (!email || !password)
			return fail(400, { message: 'Email and password are required.', email });

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { message: 'The email or password is incorrect.', email });

		const destination = url.searchParams.get('redirectTo');
		redirect(303, destination?.startsWith('/admin') ? destination : '/admin/dashboard');
	}
};
