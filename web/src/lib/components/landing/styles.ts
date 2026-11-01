/**
 * Shared Tailwind class lists for the public site. Element defaults (headings,
 * paragraphs, links) live on `root` with zero-specificity variants so any
 * utility on an element overrides them.
 *
 * Type system: Bebas Neue for headlines, labels and buttons; Coustard for
 * everything that is read. Geometry is square (3px), ruled with hairlines, and
 * the only decorative device is the cyan highlighter swipe (`mark`).
 */

export const root = [
	'@container overflow-x-clip bg-bone font-coustard text-base/[1.75] text-ink-soft',
	'[body:has(&)]:min-w-0 motion-reduce:[html:has(&)]:scroll-auto',
	'motion-reduce:**:[transition:none]! motion-reduce:**:[animation:none]!',
	'motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::before]:[animation:none]!',
	'motion-reduce:[&_*::after]:[transition:none]! motion-reduce:[&_*::after]:[animation:none]!',
	'on-text:wrap-anywhere on-tap:[-webkit-tap-highlight-color:transparent]',
	'on-link-focus:outline-3 on-link-focus:outline-cyan-ink on-link-focus:outline-offset-4',
	'on-h1:font-display on-h1:text-[clamp(4rem,9.6vw,9rem)] on-h1:leading-[0.88] on-h1:font-normal on-h1:text-ink',
	'on-h2:font-display on-h2:text-[clamp(3.25rem,5.6vw,5rem)] on-h2:leading-[0.92] on-h2:font-normal on-h2:text-ink',
	'on-h3:font-display on-h3:text-[clamp(1.875rem,3vw,2.5rem)] on-h3:leading-none on-h3:font-normal on-h3:text-ink'
].join(' ');

/** Page-width wrapper without a max-width. */
export const containerWidth =
	'mx-auto w-[min(1240px,calc(100%-96px))] *:min-w-0 bp-1100:w-[calc(100%-64px)] bp-850:w-[calc(100%-48px)] bp-640:w-[calc(100%-40px)]';
/** Page-width wrapper; the max-widths match Tailwind's `container` steps. */
export const container = `${containerWidth} sm:max-w-[40rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] 2xl:max-w-[96rem]`;

export const section = 'py-[clamp(72px,9vw,136px)]';
/** Sections with an id are scrolled to below the sticky header. */
export const anchor = 'scroll-mt-[max(84px,5rem)]';

/** Section label: small tracked Bebas, without spacing or colour. */
export const labelText =
	'flex items-center gap-3 font-display text-[1.0625rem]/none tracking-[0.2em] uppercase';
export const labelSpacing = 'mb-6 bp-640:mb-5';

/**
 * The cyan highlighter swipe behind a word: a low, slightly translucent band
 * with feathered edges so it sits under the letters instead of boxing them.
 * Colour via `--mark`, extent via `--mark-size`.
 */
export const mark =
	'[--mark-tint:color-mix(in_oklab,var(--mark,var(--color-cyan))_72%,transparent)] [-webkit-box-decoration-break:clone] [box-decoration-break:clone] bg-[linear-gradient(180deg,transparent_60%,var(--mark-tint)_65%,var(--mark-tint)_87%,transparent_92%)] bg-size-[var(--mark-size,100%_100%)] bg-no-repeat px-[0.08em] -mx-[0.08em]';

/** Pulse dot; add its background colour where used. */
export const statusDot =
	'inline-block size-[7px] flex-none rounded-[50%] [box-shadow:0_0_0_4px_#59d9e820]';

export const wordmark =
	'inline-flex min-h-11 shrink-0 items-center font-display text-[2rem] leading-none font-normal tracking-[0.01em] whitespace-nowrap';

const buttonBase =
	'group relative inline-flex min-h-[56px] items-center justify-center gap-4 rounded-[3px] px-7 pt-[0.95rem] pb-[0.8rem] font-display text-[1.3rem]/none tracking-[0.09em] [transition:background-color_0.25s,color_0.25s,transform_0.3s_cubic-bezier(0.22,1,0.36,1)] active:translate-y-px bp-360:gap-3 bp-360:px-5';
/** Primary call to action. */
export const button = `${buttonBase} bg-cyan text-ink hover:bg-ink hover:text-cyan`;
/** Primary call to action on a cyan surface. */
export const buttonInk = `${buttonBase} bg-ink text-bone hover:bg-bone hover:text-ink`;
/** Call to action on a night surface. */
export const buttonOnDark = `${buttonBase} bg-cyan text-ink hover:bg-bone`;
/** Compact header button. */
export const headerButton =
	'group inline-flex min-h-11 items-center gap-3 rounded-[3px] bg-ink px-5 pt-[0.7rem] pb-[0.55rem] font-display text-[1.125rem]/none tracking-[0.09em] text-bone [transition:background-color_0.25s,color_0.25s] hover:bg-cyan hover:text-ink';
export const buttonArrow =
	'flex-none [transition:transform_0.3s_cubic-bezier(0.22,1,0.36,1)] group-hover:[transform:translateX(4px)] motion-reduce:group-hover:[transform:none]';

/** Quiet text link with a cyan underline that thickens on hover. */
export const textLink =
	"group relative isolate inline-flex min-h-11 items-center gap-2 py-[7px] text-[0.9375rem]/[1.5] text-ink after:absolute after:inset-x-0 after:bottom-[9px] after:-z-10 after:h-[3px] after:bg-cyan after:[transition:height_0.2s] after:content-[''] hover:after:h-[0.9em]";

/** Hairline-ruled grid that holds a section's label, heading and content. */
export const rail =
	'grid grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-x-[clamp(40px,6vw,96px)] gap-y-10 cq-58:grid-cols-[minmax(0,1fr)]';

/** Paragraphs inside cards and lists. */
export const cardCopy = 'mt-3 text-[0.9375rem] leading-[1.8]';

/** Narrow reading column; use instead of `container`. */
export const pageCopy = `${containerWidth} max-w-[780px]`;
export const pageCopyText = 'mt-5 mb-7';
