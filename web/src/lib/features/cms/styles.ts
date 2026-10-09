/**
 * Shared Tailwind class lists for the content studio. Element defaults
 * (headings, form controls, buttons, focus rings) live on `studio` with
 * zero-specificity variants so any utility on an element overrides them.
 */

export const studio = [
	'min-h-screen font-arial text-base/[1.65] text-ink',
	'on-heading:font-studio on-heading:font-normal',
	'on-h1:mt-3 on-h1:mb-5 on-h1:text-[clamp(2.5rem,5vw,4rem)] on-h1:leading-none',
	'on-h2:mt-0 on-h2:mb-4 on-h2:text-[2rem]',
	'on-field:w-full on-field:rounded-[6px] on-field:border on-field:border-[#b7c6c7] on-field:[background:#fff] on-field:px-[14px] on-field:py-3 on-field:font-arial on-field:text-base/[1.5] on-field:font-normal on-field:text-ink',
	'on-textarea:resize-y',
	'on-button:cursor-pointer on-button:font-arial on-button:text-[0.875rem]/[1.4] on-button:font-semibold',
	'on-disabled:cursor-not-allowed on-disabled:opacity-50',
	'on-focus:outline-3 on-focus:outline-cyan-ink on-focus:outline-offset-[3px]'
].join(' ');

export const brand = 'font-studio text-[2rem] font-normal text-cyan';
export const eyebrow = 'text-[0.7rem] font-bold tracking-[1.5px] text-cyan-ink';
export const help = 'my-[10px] text-[0.8rem] text-muted';

const action =
	'inline-flex cursor-pointer items-center justify-center gap-[10px] rounded-[6px] border no-underline';
const actionSize = 'min-h-11 px-[18px] py-[11px]';
export const primary = `${action} ${actionSize} border-transparent bg-cyan text-ink`;
export const secondary = `${action} ${actionSize} border-[#b7c6c7] bg-transparent text-ink`;
/** Secondary action on the dark sidebar. */
export const secondaryOnDark = `${action} ${actionSize} border-[#506970] bg-transparent text-white`;
/** Secondary icon button in tight rows. */
export const secondaryCompact = `${action} min-h-11 min-w-11 p-2 border-[#b7c6c7] bg-transparent text-ink`;
export const secondaryDanger = `${action} ${actionSize} border-[#b7c6c7] bg-transparent text-[#a23131]`;
export const subtle = `${action} min-h-9 px-[10px] py-[5px] border-transparent bg-transparent text-muted`;
export const subtleDanger = `${action} min-h-9 px-[10px] py-[5px] border-transparent bg-transparent text-[#a23131]`;
export const dangerSolid =
	'min-h-11 rounded-[6px] border border-[#a23131] bg-[#a23131] px-[18px] py-[11px] text-white';

export const error =
	'my-[18px] rounded-[6px] border border-[#efb8ac] bg-[#fff1ee] p-4 text-[#962f24]';
export const success =
	'my-[18px] rounded-[6px] border border-[#a5d9ca] bg-[#edf9f5] p-4 text-[#175e4d]';

export const card = 'min-w-0 rounded-[10px] border border-line bg-paper p-7 bp-760:p-5';

/** Sign-in and recovery pages. */
export const loginPage = 'grid place-items-center bg-ink p-6';
export const authCard = 'w-[min(100%,440px)] rounded-xl bg-paper p-9 bp-760:p-6';
export const authLabel = 'my-[18px] grid gap-2 font-semibold';
export const authLink = 'mt-[18px] block text-cyan-ink underline';
export const authSubmit = 'w-full mt-4';

export const visuallyHidden =
	'absolute h-px w-px overflow-hidden [clip-path:inset(50%)] [border:0] whitespace-nowrap -m-px! p-0!';
