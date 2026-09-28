export const publicNavigation = [
	{ href: '/', label: 'Home' },
	{ href: '/about', label: 'About' },
	{ href: '/coaching', label: 'Coaching' },
	{ href: '/transformations', label: 'Transformations' },
	{ href: '/contact', label: 'Contact' }
] as const;

export const adminNavigation = [
	{ href: '/admin/dashboard', label: 'Dashboard' },
	{ href: '/admin/content', label: 'Content' },
	{ href: '/admin/testimonials', label: 'Testimonials' },
	{ href: '/admin/transformations', label: 'Transformations' }
] as const;
