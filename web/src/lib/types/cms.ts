/** Row shapes of the CMS tables in `supabase/migrations`. */

export interface SiteContent {
	id: string;
	key: string;
	title: string | null;
	body: string | null;
	metadata: Record<string, unknown>;
	updated_at: string;
}

export interface Testimonial {
	id: string;
	name: string;
	quote: string;
	role: string | null;
	image_url: string | null;
	image_alt: string | null;
	is_published: boolean;
	sort_order: number;
}

export interface Transformation {
	id: string;
	title: string;
	summary: string | null;
	story: string | null;
	before_image_url: string | null;
	after_image_url: string | null;
	before_image_alt: string | null;
	after_image_alt: string | null;
	is_published: boolean;
	sort_order: number;
}
