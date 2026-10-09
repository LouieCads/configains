/**
 * Shared Tailwind class lists for the public site. Element defaults (headings,
 * paragraphs, links) live on `root` with zero-specificity variants so any
 * utility on an element overrides them.
 */

export const root = [
	'@container overflow-x-clip bg-floor bg-(image:--image-floor-grain) bg-size-[192px_192px] font-coustard text-base/[1.8] text-ink',
	'[body:has(&)]:min-w-0 motion-reduce:[html:has(&)]:scroll-auto',
	'motion-reduce:**:[transition:none]! motion-reduce:**:[animation:none]!',
	'motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::before]:[animation:none]!',
	'motion-reduce:[&_*::after]:[transition:none]! motion-reduce:[&_*::after]:[animation:none]!',
	'on-text:wrap-anywhere on-tap:[-webkit-tap-highlight-color:transparent]',
	'on-link-focus:outline-3 on-link-focus:outline-cyan-ink on-link-focus:outline-offset-5',
	'on-p:text-muted',
	'on-h1:font-display on-h1:text-[clamp(4.875rem,7.6vw,7.25rem)] on-h1:leading-[0.99] on-h1:font-normal on-h1:tracking-[-1.6px]',
	'bp-1100:on-h1:text-[clamp(4rem,7.9vw,5.4375rem)] bp-850:on-h1:text-[clamp(4.3125rem,10vw,5.875rem)]',
	'bp-640:on-h1:text-[clamp(4.3125rem,13.8vw,5.875rem)] bp-640:on-h1:tracking-[-1px]',
	'on-h2:font-display on-h2:text-[clamp(2.875rem,4.6vw,4.125rem)] on-h2:leading-[1.06] on-h2:font-normal on-h2:tracking-[-0.4px]',
	'bp-640:on-h2:text-[3.3125rem] bp-360:on-h2:text-[2.9375rem]',
	'on-h3:text-[1.375rem] on-h3:leading-[1.45] on-h3:font-normal bp-1100:on-h3:text-[1.25rem] bp-850:on-h3:text-[1.375rem]'
].join(' ');

/** Page-width wrapper without a max-width. */
export const containerWidth =
	'mx-auto w-[min(1240px,calc(100%-96px))] *:min-w-0 bp-1100:w-[calc(100%-64px)] bp-850:w-[calc(100%-48px)] bp-640:w-[calc(100%-40px)]';
/** Page-width wrapper; the max-widths match Tailwind's `container` steps. */
export const container = `${containerWidth} sm:max-w-[40rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] 2xl:max-w-[96rem]`;

export const section = 'py-[116px] bp-850:py-[80px] bp-640:py-[68px]';
/** Sections with an id are scrolled to below the sticky header. */
export const anchor = 'scroll-mt-[max(100px,6rem)]';

/** Eyebrow typography without spacing or colour. */
export const eyebrowText =
	'flex items-center gap-3 font-arial text-[0.75rem]/[1.6] font-semibold tracking-[1.6px] bp-850:text-[0.6875rem] bp-850:tracking-[1.1px] bp-640:text-[0.625rem] bp-640:tracking-[1.2px]';
export const eyebrowSpacing = 'mb-[26px] bp-640:mb-[23px]';
export const eyebrow = `${eyebrowText} ${eyebrowSpacing} text-muted`;
export const sectionNumber = 'border-r border-r-[#c9d4d1] pr-3 text-cyan-ink';
export const outlined = '[-webkit-text-stroke:1px_var(--color-ink)] text-transparent';
/** Pulse dot; add its background colour where used. */
export const statusDot =
	'inline-block size-[7px] flex-none rounded-[50%] [box-shadow:0_0_0_4px_#59d9e818]';

export const wordmark =
	'inline-flex min-h-11 shrink-0 items-center font-display text-[1.875rem] leading-none font-normal tracking-[-0.5px] whitespace-nowrap bp-1100:text-[1.6875rem] bp-640:text-[1.75rem]';

const buttonBase =
	'group inline-flex items-center justify-between rounded-[7px] border border-transparent font-arial text-[0.875rem]/[1.5] font-semibold [transition:transform_0.3s_cubic-bezier(0.22,1,0.36,1),background_0.25s,box-shadow_0.3s] hover:[transform:translateY(-3px)] hover:[box-shadow:0_8px_20px_#1c738018] motion-reduce:hover:[transform:none] pointer-coarse:hover:[transform:none]';
const buttonSize = 'min-h-[54px] gap-[27px] px-[23px] py-[15px]';
/** Primary call to action. */
export const button =
	buttonBase +
	' ' +
	buttonSize +
	' bg-cyan text-ink hover:bg-[#7de4ed] bp-360:gap-5 bp-360:px-[18px]';
/** Call to action inside the dark app panel. */
export const appButton =
	buttonBase +
	' ' +
	buttonSize +
	' bg-cyan text-ink hover:bg-[#7de4ed] bp-850:gap-[15px] bp-850:px-[18px] bp-850:text-[0.8125rem] bp-640:gap-6 bp-640:px-[21px] bp-640:text-[0.875rem]';
/** Compact dark header button. */
export const headerButton =
	buttonBase +
	' min-h-[45px] gap-[18px] px-[18px] py-[11px] bg-ink text-white hover:bg-[#2b4148] bp-360:gap-5';
export const buttonArrow =
	'flex-none [transition:transform_0.3s] group-hover:[transform:translate(2px,-2px)]';

export const textLink =
	"relative inline-flex min-h-11 items-center gap-[18px] py-[7px] font-arial text-[0.875rem]/[1.5] font-semibold after:absolute after:bottom-0 after:left-0 after:h-px after:w-[calc(100%-36px)] after:bg-[#97a4a5] after:[transition:background_0.2s] after:content-[''] hover:text-cyan-ink hover:after:bg-cyan-ink";

export const sectionHeading =
	'mb-11 flex items-end justify-between gap-[45px] *:min-w-0 bp-850:flex-col bp-850:items-start bp-850:gap-6 bp-640:mb-[33px] bp-640:gap-[23px]';

export const serviceGrid =
	'grid grid-cols-3 gap-[22px] bp-850:grid-cols-1 cq-52:grid-cols-[minmax(0,1fr)]';
export const serviceCard =
	'min-w-0 rounded-xl border border-[#dce5e0] bg-paper p-8 [transition:transform_0.4s_cubic-bezier(0.22,1,0.36,1),box-shadow_0.4s,border-color_0.4s] hover:[transform:translateY(-6px)] hover:border-[#a7dce0] hover:[box-shadow:0_14px_30px_#183b3610] motion-reduce:hover:[transform:none] pointer-coarse:hover:[transform:none] bp-1100:p-[25px] bp-850:p-[30px] bp-640:p-[26px] bp-360:p-[23px]';
/** Paragraphs that sit directly inside a service card. */
export const serviceCopy =
	'mt-4 text-[0.9375rem] leading-[1.9] bp-850:max-w-[620px] bp-850:text-[1rem] bp-640:text-[0.9375rem]';
export const serviceDetail =
	'mt-[26px] flex items-center gap-[10px] border-t border-t-line pt-[22px] font-[Arial] text-[0.8125rem]/[1.5] bp-1100:text-[0.75rem] bp-850:text-[0.875rem] bp-640:text-[0.8125rem]';

export const storyMeta =
	'mt-[21px] mb-[11px] flex items-center justify-between gap-3 font-[Arial] text-[0.625rem]/[1.5] tracking-[1px] text-muted bp-850:flex-wrap bp-850:gap-2';
export const comingSoon =
	'rounded-[4px] border border-[#dde6de] bg-[#edf2ed] px-[7px] py-1 text-[0.5625rem] whitespace-nowrap';
/** Paragraphs inside transformation and product cards. */
export const cardCopy = 'mt-[10px] text-[0.875rem] leading-[1.9] bp-850:text-[0.9375rem]';

/** Rubber gym-mat surface; set --mat-base and --mat-light per element. */
export const matSurface =
	'isolate border border-[#182e3238] bg-(--mat-base) bg-[image:var(--image-gym-mat),radial-gradient(ellipse_at_38%_28%,var(--mat-light),var(--mat-base)_78%)] bg-size-[160px_160px,100%_100%] [box-shadow:inset_0_1px_1px_#ffffff1a,inset_0_-5px_8px_#00000018,0_3px_0_#142c3026,0_12px_24px_#1832350a]';

/** Narrow reading column; use instead of `container`. */
export const pageCopy = `${containerWidth} max-w-[850px]`;
export const pageCopyText = 'mt-5 mb-7';
