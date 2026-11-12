import type { SupabaseClient } from '@supabase/supabase-js';
import { openStatuses } from '$lib/coaching/labels';
import { phaseTiming, phaseTimingLabel } from '$lib/coaching/phase-timing';

/** One thing waiting on the coach, linking to the right place on the client's page. */
export type CoachTask = {
	clientId: string;
	clientName: string;
	/** What is waiting, for example "Submitted 12 Nov" or the start of a message. */
	detail: string;
	at: string;
	href: string;
};

export type CoachTasks = {
	assessments: CoachTask[];
	checkIns: CoachTask[];
	messages: CoachTask[];
	phases: CoachTask[];
};

type ClientEmbed =
	{ id: string; display_name: string | null } | { id: string; display_name: string | null }[];

const listLimit = 25;
const clientOf = (embed: unknown) => {
	const client = (Array.isArray(embed) ? embed[0] : embed) as
		{ id: string; display_name: string | null } | undefined;
	return { id: client?.id ?? '', name: client?.display_name ?? 'Unnamed client' };
};
const snippet = (text: string, max = 90) =>
	text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
const day = (value: string) =>
	new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Archived clients are left out: `!inner` plus the filter on the embedded profile.
const clientColumns = 'client:client_profiles!inner(id, display_name, archived_at)';

/**
 * The coach's daily list: assessments to review, check-ins without feedback, unread client
 * messages, and clients past their planned phase length. A failed query leaves its list empty.
 */
export async function loadCoachTasks(
	supabase: SupabaseClient,
	now: Date = new Date()
): Promise<CoachTasks> {
	const [assessments, checkIns, messages, programs] = await Promise.all([
		supabase
			.from('assessments')
			.select(`id, status, created_at, ${clientColumns}`)
			.in('status', openStatuses)
			.is('client.archived_at', null)
			.order('created_at', { ascending: true })
			.limit(listLimit),
		supabase
			.from('check_ins')
			.select(`id, body, created_at, ${clientColumns}`)
			.is('coach_feedback', null)
			.is('client.archived_at', null)
			.order('created_at', { ascending: true })
			.limit(listLimit),
		supabase
			.from('messages')
			.select(`id, body, created_at, ${clientColumns}`)
			.eq('sender_role', 'client')
			.is('read_at', null)
			.is('client.archived_at', null)
			.order('created_at', { ascending: false })
			.limit(200),
		supabase
			.from('client_programs')
			.select(
				`id, phase_started_at, ${clientColumns},
				current:template_phases!current_phase_id(id, position, duration_weeks, template_id,
					template:program_templates!template_id(template_phases(count)))`
			)
			.eq('status', 'active')
			.is('client.archived_at', null)
			.not('current_phase_id', 'is', null)
	]);

	const assessmentTasks = (assessments.data ?? []).map((row) => {
		const client = clientOf(row.client as ClientEmbed);
		return {
			clientId: client.id,
			clientName: client.name,
			detail:
				row.status === 'submitted'
					? `Not matched yet, submitted ${day(row.created_at)}`
					: `Needs your review, submitted ${day(row.created_at)}`,
			at: row.created_at as string,
			href: `/admin/clients/${client.id}#assessment`
		};
	});

	const checkInTasks = (checkIns.data ?? []).map((row) => {
		const client = clientOf(row.client as ClientEmbed);
		return {
			clientId: client.id,
			clientName: client.name,
			detail: snippet(row.body as string),
			at: row.created_at as string,
			href: `/admin/clients/${client.id}#check-ins`
		};
	});

	// One row per client: the newest unread message and how many are waiting.
	const unread = new Map<string, CoachTask & { count: number }>();
	for (const row of messages.data ?? []) {
		const client = clientOf(row.client as ClientEmbed);
		const existing = unread.get(client.id);
		if (existing) existing.count++;
		else
			unread.set(client.id, {
				clientId: client.id,
				clientName: client.name,
				detail: snippet(row.body as string),
				at: row.created_at as string,
				href: `/admin/clients/${client.id}#messages`,
				count: 1
			});
	}
	const messageTasks = [...unread.values()].slice(0, listLimit).map(({ count, ...task }) => ({
		...task,
		detail: count > 1 ? `${count} new: ${task.detail}` : task.detail
	}));

	const phaseTasks: CoachTask[] = [];
	for (const row of programs.data ?? []) {
		const current = (Array.isArray(row.current) ? row.current[0] : row.current) as
			| {
					position: number;
					duration_weeks: number | null;
					template:
						| { template_phases: { count: number }[] }
						| { template_phases: { count: number }[] }[]
						| null;
			  }
			| undefined;
		if (!current?.duration_weeks) continue;
		const timing = phaseTiming(row.phase_started_at as string, current.duration_weeks, now);
		if (!timing.due) continue;
		const template = Array.isArray(current.template) ? current.template[0] : current.template;
		const phaseCount = template?.template_phases?.[0]?.count ?? current.position;
		const client = clientOf(row.client as ClientEmbed);
		phaseTasks.push({
			clientId: client.id,
			clientName: client.name,
			detail: phaseTimingLabel(timing, current.position >= phaseCount),
			at: row.phase_started_at as string,
			href: `/admin/clients/${client.id}#program`
		});
	}
	phaseTasks.sort((a, b) => a.at.localeCompare(b.at));

	return {
		assessments: assessmentTasks,
		checkIns: checkInTasks,
		messages: messageTasks,
		phases: phaseTasks.slice(0, listLimit)
	};
}

/** Marks a client's messages as read by the coach. Failure only leaves them flagged as new. */
export async function markMessagesRead(supabase: SupabaseClient, clientId: string) {
	const { error } = await supabase
		.from('messages')
		.update({ read_at: new Date().toISOString() })
		.eq('client_id', clientId)
		.eq('sender_role', 'client')
		.is('read_at', null);
	return !error;
}
