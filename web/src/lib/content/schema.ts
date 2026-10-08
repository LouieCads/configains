import { defaultSectionOrder, validSectionOrder } from './home-sections';

export type Field = {
	label: string;
	kind: 'text' | 'textarea' | 'image' | 'url' | 'email' | 'boolean' | 'group' | 'list';
	defaultValue?: string | boolean;
	fields?: Record<string, Field>;
	item?: Field;
	items?: unknown[];
	help?: string;
	editor?: 'sectionOrder';
};

const text = (label: string, defaultValue = '', help?: string): Field => ({
	label,
	kind: 'text',
	defaultValue,
	help
});
const area = (label: string, defaultValue = ''): Field => ({
	label,
	kind: 'textarea',
	defaultValue
});
const url = (label: string, defaultValue = ''): Field => ({ label, kind: 'url', defaultValue });
const image = (label: string, defaultValue = ''): Field => ({ label, kind: 'image', defaultValue });
const toggle = (label: string, defaultValue = true): Field => ({
	label,
	kind: 'boolean',
	defaultValue
});
const group = (label: string, fields: Record<string, Field>, help?: string): Field => ({
	label,
	kind: 'group',
	fields,
	help
});
const list = (label: string, item: Field, items: unknown[]): Field => ({
	label,
	kind: 'list',
	item,
	items
});
const heading = (label: string, first: string, accent: string): Field =>
	group(label, { first: area('Opening line', first), accent: area('Accent line', accent) });
const hero = (eyebrow: string, title: string, copy: string): Field =>
	group('Page introduction', {
		eyebrow: text('Eyebrow', eyebrow),
		title: area('Heading', title),
		copy: area('Introduction', copy)
	});
const seo = (title: string, description: string): Field =>
	group('Search and sharing', {
		title: text('Page title', title),
		description: area('Description', description),
		image: image('Social preview image (optional)'),
		imageAlt: text('Social preview image description')
	});

export const serviceTemplate = {
	title: 'New coaching service',
	copy: 'Describe this service.',
	detail: 'Service benefit',
	icon: 'training'
};
export const serviceDefaults = [
	{
		title: 'Train with purpose.',
		copy: 'A clear direction in the gym, built around your starting point, your schedule, and the equipment you have.',
		detail: 'Training that fits your goals',
		icon: 'training'
	},
	{
		title: 'Eat for your life.',
		copy: 'Flexible nutrition guidance and everyday habits. Make room for the food you enjoy while working toward your goals.',
		detail: 'Practical nutrition support',
		icon: 'nutrition'
	},
	{
		title: 'Keep moving forward.',
		copy: 'A coach to ask, a place to reflect, and support to find your next step when real life changes the plan.',
		detail: 'Support & accountability',
		icon: 'support'
	}
];

const question = (label: string, options: string[]): Field =>
	group(label, {
		label: text('Question', label),
		placeholder: text('Selection prompt', 'Choose what fits you best'),
		options: list('Answer options', text('Option', 'New option'), options)
	});

export const websiteSchema: Field = group('Website', {
	brand: group(
		'Brand and contact',
		{
			name: text('Brand name', 'Configains'),
			wordmark: text('Wordmark', 'CONFIGAINS.'),
			tagline: text('Tagline', 'Real life. Real progress.'),
			founder: text('Coach name', 'Cash Fuerte'),
			role: text('Coach role', 'Founder & coach, Configains.'),
			bio: area(
				'Coach introduction',
				'Hey, I’m Cash Fuerte, the founder and coach behind Configains. I personally review your assessment, recommend your next steps, and guide you through the work. You’ll have a human coach to ask questions, check in with, and work through real-life challenges.'
			),
			portrait: image('Coach portrait'),
			portraitAlt: text('Portrait description', 'Cash Fuerte, founder and coach of Configains'),
			portraitPlaceholder: text('Portrait placeholder label', 'COACH PORTRAIT / COMING SOON'),
			logo: image('Logo (optional)'),
			logoAlt: text('Logo description', 'Configains'),
			favicon: image('Browser icon', '/favicon.svg'),
			email: { label: 'Public contact email', kind: 'email', defaultValue: 'configains@gmail.com' },
			canonicalUrl: url('Public website URL', 'https://configains.fundrstudio.com'),
			socialImage: image('Default social preview image', '/og-image.png'),
			socialImageAlt: text(
				'Social image description',
				'Configains fitness and nutrition coaching with Cash Fuerte. Build strength. Make it last.'
			),
			socialLinks: list(
				'Social profiles',
				group('Profile', {
					label: text('Platform', 'Social profile'),
					href: url('Profile URL', 'https://example.com')
				}),
				[]
			)
		},
		'Upload approved brand assets here. The website URL controls canonical links and the sitemap.'
	),
	navigation: group('Navigation and footer', {
		items: list(
			'Main navigation',
			group('Link', { label: text('Link label', 'New link'), href: url('Destination', '/about') }),
			[
				{ label: 'Home', href: '/#home' },
				{ label: 'About', href: '/#about' },
				{ label: 'Coaching', href: '/#coaching' },
				{ label: 'Transformations', href: '/#transformations' },
				{ label: 'Products', href: '/#products' },
				{ label: 'FAQ', href: '/#faq' }
			]
		),
		contactLabel: text('Header contact button', 'Let’s talk'),
		menuOpen: text('Open menu label', 'Menu'),
		menuClose: text('Close menu label', 'Close'),
		skipLabel: text('Skip navigation link', 'Skip to content'),
		backToTop: text('Back to top label', 'Back to top'),
		footerNote: text('Footer note', 'Built for the long run.'),
		contactLink: text('Footer contact link', 'Contact'),
		appLink: text('Footer app link', 'Configains app')
	}),
	home: group('Home page', {
		sectionOrder: {
			...list('Section order', text('Section'), defaultSectionOrder),
			editor: 'sectionOrder'
		},
		seo: seo(
			'Configains | Online Fitness Coaching with Cash Fuerte',
			'Build strength and confidence with Configains. Cash Fuerte combines practical training, flexible nutrition, and personal coaching built around your life.'
		),
		hero: group('Hero', {
			firstLine: text('First headline line', 'REAL LIFE.'),
			secondLine: text('Second headline opening', 'REAL'),
			rotatingWords: list('Rotating headline words', text('Word', 'PROGRESS.'), [
				'PROGRESS.',
				'RESULTS.',
				'GROWTH.',
				'CHANGE.'
			]),
			copy: area(
				'Description',
				'Build strength and confidence with Configains. Practical training, flexible nutrition, and personal guidance from Cash Fuerte, our founder and coach.'
			),
			cta: text('Primary button', 'Find your starting point'),
			explore: text('Coaching link', 'Explore coaching'),
			visualLabel: text('Illustration label', 'THE CONFIGAINS APPROACH'),
			visualTitle: area('Illustration heading', 'A LITTLE\nSTRONGER.'),
			image: image('Hero image (optional; replaces illustration)'),
			imageAlt: text('Hero image description', 'Configains fitness coaching'),
			principles: list('Principles strip', text('Principle', 'New principle'), [
				'TRAIN WITH PURPOSE',
				'EAT LIKE A HUMAN',
				'SHOW UP FOR YOURSELF',
				'BUILD FOR THE LONG RUN'
			])
		}),
		about: group('Coach introduction', {
			eyebrow: text('Section label', 'MEET CONFIGAINS'),
			portraitLabel: text('Portrait card label', 'THE FOUNDER BEHIND CONFIGAINS'),
			heading: heading('Heading', 'COACHING WITH', 'A HUMAN SIDE.'),
			intro: area('Introduction', 'Built around your life. Guided by a real coach.'),
			copy: area(
				'Brand description',
				'Configains brings training, nutrition, and accountability together to help you build strength and confidence that last. Your goals and starting point shape the plan.'
			),
			philosophy: area(
				'Philosophy note',
				'You don’t need a perfect routine.\nYou need one you can come back to.'
			)
		}),
		coaching: group('Coaching section', {
			eyebrow: text('Section label', 'CONFIGAINS COACHING'),
			heading: heading('Heading', 'LESS GUESSWORK.', 'MORE DIRECTION.'),
			cta: text('Inquiry link', 'Talk about your goals')
		}),
		proof: group('Social proof placeholders', {
			eyebrow: text('Transformation section label', 'PROGRESS IN PRACTICE'),
			heading: heading('Transformation heading', 'REAL WORK.', 'PERSONAL PROGRESS.'),
			placeholderTitles: list('Placeholder journeys', text('Journey title', 'New journey'), [
				'Building strength',
				'Finding consistency',
				'Growing confidence'
			]),
			placeholderCopy: area(
				'Placeholder explanation',
				'A real client’s journey will go here, shared with their permission.'
			),
			photoPlaceholder: text('Photo placeholder', 'Photo coming soon'),
			before: text('Before label', 'Before'),
			after: text('After label', 'After'),
			journey: text('Journey label', 'JOURNEY'),
			comingSoon: text('Status label', 'COMING SOON'),
			testimonialEyebrow: text('Testimonial section label', 'THE COMMUNITY'),
			testimonialHeading: heading('Testimonial heading', 'THEIR JOURNEY.', 'THEIR WORDS.'),
			testimonialPlaceholder: area(
				'Testimonial placeholder',
				'Good progress deserves\nan honest story.'
			),
			testimonialStatus: text('Testimonial status', 'CLIENT STORIES COMING SOON'),
			testimonialHint: area(
				'Testimonial explanation',
				'Reserved for real feedback from the Configains community.'
			)
		}),
		products: group('Product previews', {
			enabled: toggle('Show product previews'),
			eyebrow: text('Section label', 'YOUR EVERYDAY TOOLKIT'),
			heading: heading('Heading', 'A LITTLE STRUCTURE.', 'A STEP FORWARD.'),
			coverLabel: text('Cover label', 'CONFIGAINS / THE TOOLKIT'),
			coverNote: area('Cover footer', 'A LITTLE STRUCTURE.\nA STEP FORWARD.'),
			placeholderLabel: text('Placeholder label', 'COVER PLACEHOLDER'),
			items: list(
				'Products',
				group('Product', {
					type: text('Product type', 'E-BOOK'),
					title: text('Title', 'New resource'),
					copy: area('Description'),
					cover: area('Cover text', 'START\nSIMPLE.'),
					image: image('Cover image'),
					imageAlt: text('Cover image description'),
					status: text('Availability label', 'COMING SOON')
				}),
				[
					{
						type: 'E-BOOK',
						title: 'The foundations.',
						copy: 'A practical starting point for building better fitness habits.',
						cover: 'START\nSIMPLE.',
						image: '',
						imageAlt: '',
						status: 'COMING SOON'
					},
					{
						type: 'WORKOUT PLAN',
						title: 'A little more structure.',
						copy: 'A clear framework to bring purpose to your training.',
						cover: 'SHOW\nUP.',
						image: '',
						imageAlt: '',
						status: 'COMING SOON'
					},
					{
						type: 'TEMPLATE',
						title: 'See your progress.',
						copy: 'Simple tools to help you reflect, plan, and stay consistent.',
						cover: 'KEEP\nGOING.',
						image: '',
						imageAlt: '',
						status: 'COMING SOON'
					}
				]
			)
		}),
		app: group('Configains app link', {
			enabled: toggle('Show app section'),
			ready: toggle('App link is ready', true),
			url: url('App URL', 'https://configains.app'),
			eyebrow: text('Section label', 'YOUR NEXT STEP, ONLINE'),
			heading: heading('Heading', 'YOUR PROGRESS.', 'YOUR SPACE.'),
			copy: area(
				'Description',
				'Meet the Configains app.\nA space to support your coaching journey, with Cash Fuerte guiding the plan and the decisions along the way.'
			),
			cta: text('App button', 'Explore configains.app'),
			unavailable: text('Not-ready label', 'App updates coming soon'),
			previewImage: image('App preview image'),
			previewAlt: text('App preview description', 'Preview of the Configains app'),
			deviceHeading: area('Device headline', 'A LITTLE\nSTRONGER.\nEVERY DAY.'),
			previewLabel: text('Preview placeholder label', 'APP PREVIEW PLACEHOLDER')
		}),
		contact: group('Contact section', {
			heading: heading('Heading', 'YOUR NEXT CHAPTER.', 'LET’S FIGURE IT OUT.'),
			copy: area(
				'Description',
				'Start with a quick fitness and nutrition assessment.\nCash Fuerte will review your answers and email you a recommended program, plan, and duration.'
			),
			cta: text('Inquiry button', 'Let’s talk about coaching')
		})
	}),
	services: list(
		'Coaching services',
		group('Service', {
			title: text('Title', serviceTemplate.title),
			copy: area('Description', serviceTemplate.copy),
			detail: text('Benefit', serviceTemplate.detail),
			icon: text('Icon style (training, nutrition or support)', 'training')
		}),
		serviceDefaults
	),
	about: group('About page', {
		seo: seo(
			'About Cash Fuerte & Configains | Fitness Coaching',
			'Meet Cash Fuerte, founder and coach of Configains. Learn about practical training, flexible nutrition, and a sustainable approach to strength and confidence.'
		),
		hero: hero(
			'About Configains',
			'Coaching for the long game.',
			'Configains exists to make getting stronger feel clear, practical, and sustainable.'
		),
		sections: list(
			'Content sections',
			group('Section', { heading: text('Heading', 'New section'), body: area('Body') }),
			[
				{
					heading: 'No extremes required.',
					body: 'The best plan is one you can keep following. We combine progressive training, flexible nutrition, and direct support to help you build habits that hold up outside a perfect week.'
				},
				{
					heading: 'Meet Cash Fuerte, founder and coach.',
					body: 'Cash Fuerte founded Configains to bring practical training, nutrition, and personal guidance together. He reviews your assessment, recommends a program that fits your starting point, and supports you as your goals and routine evolve.'
				}
			]
		),
		cta: text('Inquiry button', 'Find your starting point')
	}),
	coaching: group('Coaching page', {
		seo: seo(
			'Online Fitness Coaching | Configains with Cash Fuerte',
			'Explore Configains coaching with Cash Fuerte: training direction, nutrition guidance, and accountability. Start with a fitness and nutrition assessment.'
		),
		hero: hero(
			'Configains coaching',
			'A plan built around you.',
			'Training, nutrition, and accountability with personal guidance from Cash Fuerte, the founder and coach behind Configains.'
		),
		closingTitle: text('Next-step heading', 'Start with your story.'),
		closingCopy: area(
			'Next-step description',
			'Complete a quick fitness and nutrition assessment. Cash Fuerte will personally review your answers and email you a recommended Configains program, plan, and duration.'
		),
		cta: text('Inquiry button', 'Find your starting point')
	}),
	transformations: group('Transformations page', {
		seo: seo(
			'Client Transformations | Configains',
			'Configains client stories of strength, confidence, and consistency. Approved transformation photos and testimonials will be shared with permission.'
		),
		hero: hero(
			'Transformations',
			'Progress beyond the photo.',
			'Real stories of strength, confidence, and consistency built one step at a time.'
		),
		empty: area('Placeholder text', 'Transformation stories are coming soon.')
	}),
	faq: group('Questions and answers', {
		enabled: toggle('Show FAQ section'),
		eyebrow: text('Section label', 'A CLEAR STARTING POINT'),
		heading: heading('Heading', 'YOUR QUESTIONS.', 'CLEAR ANSWERS.'),
		items: list(
			'FAQs',
			group('Question and answer', {
				question: text('Question', 'New question'),
				answer: area('Answer')
			}),
			[
				{
					question: 'What is Configains?',
					answer:
						'Configains is a fitness coaching brand founded by Cash Fuerte. It brings practical training, flexible nutrition, and accountability together to support sustainable progress.'
				},
				{
					question: 'Who is Cash Fuerte?',
					answer:
						'Cash Fuerte is the founder and coach behind Configains. He personally reviews coaching assessments and recommends a program, plan, and duration to discuss with each potential client.'
				},
				{
					question: 'How do I start coaching with Configains?',
					answer:
						'Complete the fitness and nutrition assessment on the Contact page or email Configains. Cash Fuerte will review your starting point and contact you to discuss next steps.'
				},
				{
					question: 'Do I need a visitor account?',
					answer:
						'No. You can read about Configains and send a coaching inquiry without creating an account.'
				},
				{
					question: 'What does Configains coaching cover?',
					answer:
						'The coaching approach covers training direction, nutrition guidance, and accountability. The recommended program depends on your goals, starting point, and routine.'
				}
			]
		)
	}),
	contact: group('Assessment and contact page', {
		seo: seo(
			'Fitness & Nutrition Assessment | Configains',
			'Share your fitness and nutrition starting point with Configains. Cash Fuerte personally reviews your assessment and recommends coaching next steps.'
		),
		hero: group('Page introduction', {
			title: area('Heading', 'YOUR STARTING POINT.\nYOUR WAY FORWARD.'),
			copy: area(
				'Introduction',
				'Tell us what you know, what you’ve tried, and where you want to go. There are no right or wrong answers. Cash Fuerte, our founder and coach, will personally review your responses.'
			)
		}),
		intro: text('Short introduction', 'A quick fitness & nutrition assessment.'),
		back: text('Back link', 'Back to Configains'),
		steps: list(
			'What happens next',
			group('Step', { title: text('Title', 'Next step'), copy: area('Description') }),
			[
				{
					title: 'Share your starting point.',
					copy: 'About 3 to 5 minutes. No fitness expertise needed.'
				},
				{
					title: 'Cash Fuerte reviews your answers.',
					copy: 'Your experience, routine, and goals guide his recommendation.'
				},
				{
					title: 'Get a personal recommendation.',
					copy: 'Cash Fuerte emails you a Configains program, plan, and duration to discuss together.'
				}
			]
		),
		sectionOne: text('First field group', 'A little about you'),
		sectionTwo: text('Second field group', 'Your training starting point'),
		sectionThree: text('Third field group', 'Nutrition & everyday life'),
		nameLabel: text('Name field label', 'Your name'),
		emailLabel: text('Email field label', 'Email address'),
		emailHelp: area(
			'Email field help',
			'Cash Fuerte will send your recommendation to this email address.'
		),
		goal: question('What would you most like to work toward?', [
			'Build strength and muscle',
			'Lose body fat',
			'Improve general fitness',
			'Build consistent habits',
			'Feel more confident with training and nutrition',
			'Explore my options with a coach'
		]),
		trainingExperience: question('How much training experience do you have?', [
			'I’m new to structured training',
			'I’ve tried it, but haven’t found consistency',
			'I train regularly and want more direction',
			'I’m returning after a break'
		]),
		fitnessKnowledge: question(
			'How confident are you planning a workout and using good exercise technique?',
			[
				'I’d like help with the basics',
				'I know some basics, but still need guidance',
				'I’m comfortable and want to refine my approach'
			]
		),
		trainingDays: question('Realistically, how often can you train?', [
			'1 to 2 days',
			'3 to 4 days',
			'5+ days',
			'I need help figuring this out'
		]),
		trainingLocation: question('Where would you train?', [
			'At a gym',
			'At home with equipment',
			'At home with little or no equipment',
			'A mix / not sure yet'
		]),
		nutritionKnowledge: question(
			'How familiar are you with nutrition basics, like protein, portions, and balanced meals?',
			[
				'I’m just getting started',
				'I know the basics, but find them hard to apply',
				'I’m comfortable and want more specific guidance'
			]
		),
		nutritionExperience: question('What’s your experience with nutrition habits or plans?', [
			'I haven’t followed a nutrition approach before',
			'I’ve tried diets or plans, but struggled to sustain them',
			'I work on balanced meals and portions without tracking',
			'I’ve tracked food or followed a structured plan'
		]),
		challengeLabel: text('Challenge field label', 'What’s your biggest challenge right now?'),
		challengePlaceholder: area(
			'Challenge placeholder',
			'For example: finding time, knowing what to eat, or staying consistent.'
		),
		contextLabel: text('Additional context label', 'Anything else you’d like Cash Fuerte to know?'),
		contextPlaceholder: area(
			'Additional context placeholder',
			'Your routine, preferences, previous coaching experience, or questions.'
		),
		optionalLabel: text('Optional field label', '(optional)'),
		privacy: area(
			'Privacy explanation',
			'Your answers are shared with Configains for Cash Fuerte to review your inquiry and contact you about coaching. Please leave out sensitive medical details.'
		),
		consent: area(
			'Consent label',
			'I agree to Configains using my answers to assess my inquiry and contact me about coaching.'
		),
		submit: text('Submit button', 'Send my assessment'),
		submitting: text('Sending button label', 'Sending your assessment…'),
		sendingNote: text('Sending note', 'Please keep this page open while your answers are sent.'),
		previewError: area(
			'Local preview message',
			'This preview cannot send assessments. Your answers are still here. To inquire now, email {email}.'
		),
		error: area(
			'Delivery error message',
			'We couldn’t send your assessment. Your answers are still here. Please try again or email {email}.'
		),
		successEyebrow: text('Success label', 'YOUR FIRST STEP, TAKEN.'),
		successTitle: text('Success heading', 'Thanks for sharing your story.'),
		successCopy: area(
			'Success message',
			'Your assessment has been submitted. Cash Fuerte will review your answers and reply to the email address you provided with a recommended program, plan, and duration.'
		)
	})
});

export function defaultFor(field: Field): unknown {
	if (field.kind === 'group')
		return Object.fromEntries(
			Object.entries(field.fields ?? {}).map(([key, child]) => [key, defaultFor(child)])
		);
	if (field.kind === 'list') return structuredClone(field.items ?? []);
	return field.defaultValue ?? '';
}

// The shared schema drives the editor, defaults, and server validation.
export type Content = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export function defaultWebsite(): Content {
	return defaultFor(websiteSchema) as Content;
}

export function normalizeContent(field: Field, value: unknown): unknown {
	if (field.kind === 'group') {
		const object =
			value && typeof value === 'object' && !Array.isArray(value)
				? (value as Record<string, unknown>)
				: {};
		return Object.fromEntries(
			Object.entries(field.fields ?? {}).map(([key, child]) => [
				key,
				normalizeContent(child, object[key])
			])
		);
	}
	if (field.kind === 'list')
		return Array.isArray(value)
			? value.map((item) => normalizeContent(field.item!, item))
			: defaultFor(field);
	if (field.kind === 'boolean') return typeof value === 'boolean' ? value : defaultFor(field);
	if (typeof value !== 'string') return defaultFor(field);
	if (['url', 'image'].includes(field.kind) && value && !isSafeUrl(value)) return defaultFor(field);
	return value;
}

export function validateContent(field: Field, value: unknown, path = 'Website'): string[] {
	if (field.kind === 'group') {
		if (!value || typeof value !== 'object' || Array.isArray(value))
			return [`${path}: expected a section.`];
		return Object.entries(field.fields ?? {}).flatMap(([key, child]) =>
			validateContent(child, (value as Record<string, unknown>)[key], `${path} / ${child.label}`)
		);
	}
	if (field.kind === 'list') {
		if (!Array.isArray(value) || value.length > 50) return [`${path}: use up to 50 items.`];
		return value.flatMap((item, index) =>
			validateContent(field.item!, item, `${path} ${index + 1}`)
		);
	}
	if (field.kind === 'boolean')
		return typeof value === 'boolean' ? [] : [`${path}: expected on or off.`];
	if (typeof value !== 'string' || value.length > (field.kind === 'textarea' ? 12000 : 2000))
		return [`${path}: text is invalid or too long.`];
	if (value && field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
		return [`${path}: enter a valid email.`];
	if (value && ['url', 'image'].includes(field.kind) && !isSafeUrl(value))
		return [`${path}: use an HTTPS address or a local path starting with /.`];
	return [];
}

export function isSafeUrl(value: string): boolean {
	if (/^\/(?!\/)[^\\\s]*$/.test(value)) return true;
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
	} catch {
		return false;
	}
}

export function validateWebsite(value: Content): string[] {
	const errors = validateContent(websiteSchema, value);
	if (errors.length) return errors;
	if (!validSectionOrder(value.home.sectionOrder))
		errors.push('Home: include every homepage section exactly once in the section order.');
	for (const key of ['name', 'founder', 'email'])
		if (!value.brand[key].trim()) errors.push(`Brand: ${key} is required.`);
	if (!value.brand.socialImage.trim())
		errors.push('Brand: a default social preview image is required.');
	if (value.brand.canonicalUrl) {
		try {
			const parsed = new URL(value.brand.canonicalUrl);
			if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash)
				errors.push('Public website URL must be an HTTPS origin without a path.');
		} catch {
			errors.push('Public website URL must be an HTTPS origin.');
		}
	}
	for (const page of ['home', 'about', 'coaching', 'transformations', 'contact']) {
		if (!value[page].seo.title.trim() || !value[page].seo.description.trim())
			errors.push(`${page}: search title and description are required.`);
		if (page !== 'home' && !value[page].hero.title.trim())
			errors.push(`${page}: page heading is required.`);
	}
	if (!value.home.hero.firstLine.trim()) errors.push('Home: the headline is required.');
	if (
		!value.home.hero.rotatingWords.length ||
		value.home.hero.rotatingWords.some((word: string) => !word.trim())
	)
		errors.push('Hero: add at least one non-empty headline word.');
	for (const key of [
		'goal',
		'trainingExperience',
		'fitnessKnowledge',
		'trainingDays',
		'trainingLocation',
		'nutritionKnowledge',
		'nutritionExperience'
	]) {
		if (
			!value.contact[key].label.trim() ||
			!value.contact[key].options.length ||
			value.contact[key].options.some((option: string) => !option.trim())
		)
			errors.push(`Assessment: ${key} needs a question and non-empty answer options.`);
	}
	if (
		value.faq.enabled &&
		value.faq.items.some(
			(item: { question: string; answer: string }) => !item.question.trim() || !item.answer.trim()
		)
	)
		errors.push('FAQ: every question needs an answer.');
	if (value.home.app.enabled && value.home.app.ready && !value.home.app.url)
		errors.push('App: a ready app needs a destination URL.');
	return errors;
}
