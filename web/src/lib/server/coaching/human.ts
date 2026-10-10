import type { SupabaseClient } from '@supabase/supabase-js';

export type CheckIn = {
	id: string;
	submitted_on: string;
	body: string;
	coach_feedback: string | null;
	feedback_at: string | null;
};

export type Message = {
	id: string;
	sender_role: 'client' | 'coach';
	body: string;
	created_at: string;
};

/** Check-ins and messages for one client. Row-level security limits clients to their own rows. */
export async function loadCoachingThread(supabase: SupabaseClient, clientId: string) {
	const [checkIns, messages] = await Promise.all([
		supabase
			.from('check_ins')
			.select('id, submitted_on, body, coach_feedback, feedback_at')
			.eq('client_id', clientId)
			.order('created_at', { ascending: false })
			.limit(50),
		supabase
			.from('messages')
			.select('id, sender_role, body, created_at')
			.eq('client_id', clientId)
			.order('created_at', { ascending: true })
			.limit(200)
	]);
	if (checkIns.error) throw checkIns.error;
	if (messages.error) throw messages.error;
	return {
		checkIns: (checkIns.data ?? []) as CheckIn[],
		messages: (messages.data ?? []) as Message[]
	};
}

export async function submitCheckIn(
	supabase: SupabaseClient,
	clientId: string,
	programId: string | null,
	body: string
) {
	const { error } = await supabase
		.from('check_ins')
		.insert({ client_id: clientId, client_program_id: programId, body });
	return error ? { ok: false as const } : { ok: true as const };
}

export async function saveCheckInFeedback(
	supabase: SupabaseClient,
	clientId: string,
	checkInId: string,
	feedback: string
) {
	const { data, error } = await supabase
		.from('check_ins')
		.update({ coach_feedback: feedback, feedback_at: new Date().toISOString() })
		.eq('id', checkInId)
		.eq('client_id', clientId)
		.select('id');
	return error || !data?.length ? { ok: false as const } : { ok: true as const };
}

export async function sendMessage(
	supabase: SupabaseClient,
	clientId: string,
	senderRole: 'client' | 'coach',
	body: string
) {
	const { error } = await supabase
		.from('messages')
		.insert({ client_id: clientId, sender_role: senderRole, body });
	return error ? { ok: false as const } : { ok: true as const };
}
