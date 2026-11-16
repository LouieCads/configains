export const publicNavigation = [
	{ href: '/', label: 'Home' },
	{ href: '/about', label: 'About' },
	{ href: '/coaching', label: 'Coaching' },
	{ href: '/transformations', label: 'Transformations' },
	{ href: '/contact', label: 'Contact' }
] as const;

/**
 * Where existing clients sign in. Always shown on the public site, so a client who has logged out
 * (or lost their invitation email) can find the way back. Not editable in the CMS.
 */
export const clientSignIn = { href: '/login', label: 'Client sign in' } as const;

/** Admin sidebar, in groups. A group without a heading sits at the top. */
export const adminNavigation = [
	{ heading: '', items: [{ href: '/admin/dashboard', label: 'Dashboard' }] },
	{
		heading: 'Website',
		items: [
			{ href: '/admin/content', label: 'Content' },
			{ href: '/admin/testimonials', label: 'Testimonials' },
			{ href: '/admin/transformations', label: 'Transformations' }
		]
	},
	{
		heading: 'Coaching',
		items: [
			{ href: '/admin/clients', label: 'Clients' },
			{ href: '/admin/assessments', label: 'Assessments' },
			{ href: '/admin/templates', label: 'Templates' },
			{ href: '/admin/exercises', label: 'Exercise library' }
		]
	}
] as const;
