/**
 * File-backed stand-in for Supabase used by the local admin demo
 * (`LOCAL_ADMIN_DEMO=true`, see `local-demo-policy.ts`).
 *
 * Implements only the query-builder, RPC, auth, and storage calls the app
 * makes, with the same visibility rules as the database policies: signed-out
 * visitors see published rows and never the draft. State lives in
 * `.local-cms/<instance>/content.json`; writes are serialized and atomic.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, sep, dirname } from 'node:path';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export const demoCookie = 'configains-local-demo';
const demoId = '10000000-0000-0000-0000-000000000001';
/** Demo session token → expiry timestamp (in memory; cleared on restart). */
const sessions = new Map<string, number>();
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
// Tests can use their own local store without touching the current preview.
const instance = env.LOCAL_ADMIN_DEMO_INSTANCE || 'default';
const root = resolve(
	process.cwd(),
	'.local-cms',
	/^[a-z0-9_-]+$/i.test(instance) ? instance : 'default'
);
const stateFile = resolve(root, 'content.json');
type Row = Record<string, unknown> & { id: string };
type State = Record<string, Row[]>;
type Result = { data: unknown; error: { message: string; code: string } | null; count?: number };
/** Tail of the write queue; reads wait for it so they never see half-applied state. */
let pendingWrite = Promise.resolve();
const ok = (data: unknown, count?: number): Result => ({ data, error: null, count });
const conflict = (): Result => ({
	data: null,
	error: { code: '40001', message: 'Draft has changed.' }
});
const denied = (): Result => ({
	data: null,
	error: { code: '42501', message: 'Sign in to the local demo first.' }
});

export function startDemoSession() {
	for (const [token, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(token);
	const token = crypto.randomUUID();
	sessions.set(token, Date.now() + SESSION_LIFETIME_MS);
	return token;
}
export function hasDemoSession(token: string | undefined) {
	return !!token && (sessions.get(token) ?? 0) > Date.now();
}
export function endDemoSession(token: string | undefined) {
	if (token) sessions.delete(token);
}

async function readState(): Promise<State> {
	try {
		return JSON.parse(await readFile(stateFile, 'utf8'));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		return { site_content: [], testimonials: [], transformations: [] };
	}
}
/** A timestamp later than every stored row, so revisions always increase. */
function revision(state: State) {
	return new Date(
		Math.max(
			Date.now(),
			...Object.values(state)
				.flat()
				.map((row) => Date.parse(String(row.updated_at)) || 0)
		) + 1
	).toISOString();
}
/** Runs `operation` on fresh state and persists it unless it returned an error. */
function mutate(operation: (state: State) => Result): Promise<Result> {
	const result = pendingWrite.then(async () => {
		const state = await readState(),
			output = operation(state);
		if (!output.error) {
			await mkdir(root, { recursive: true });
			const temporary = stateFile + '.' + crypto.randomUUID() + '.tmp';
			await writeFile(temporary, JSON.stringify(state, null, 2));
			await rename(temporary, stateFile);
		}
		return output;
	});
	pendingWrite = result.then(
		() => undefined,
		() => undefined
	);
	return result;
}

/** Minimal thenable mirror of Supabase's PostgREST query builder. */
class Query {
	private filters: [string, unknown][] = [];
	private sorting?: { field: string; ascending: boolean };
	private maximum?: number;
	private mode = 'read';
	private payload: Record<string, unknown> = {};
	private singular = false;
	private head = false;
	constructor(
		private table: string,
		private signedIn: boolean
	) {}
	select(...args: [string?, { head?: boolean }?]) {
		this.head = args[1]?.head ?? false;
		return this;
	}
	eq(field: string, value: unknown) {
		this.filters.push([field, value]);
		return this;
	}
	order(field: string, options?: { ascending?: boolean }) {
		this.sorting = { field, ascending: options?.ascending ?? true };
		return this;
	}
	limit(maximum: number) {
		this.maximum = maximum;
		return this;
	}
	single() {
		this.singular = true;
		return this;
	}
	maybeSingle() {
		this.singular = true;
		return this;
	}
	insert(payload: Record<string, unknown>) {
		this.mode = 'insert';
		this.payload = payload;
		return this;
	}
	update(payload: Record<string, unknown>) {
		this.mode = 'update';
		this.payload = payload;
		return this;
	}
	delete() {
		this.mode = 'delete';
		return this;
	}
	private apply(state: State): Result {
		if (this.mode !== 'read' && !this.signedIn) return denied();
		let rows: Row[] =
			this.table === 'admin_profiles'
				? this.signedIn
					? [{ id: demoId, display_name: 'Local demo' }]
					: []
				: (state[this.table] ?? []).filter(
						(row) =>
							this.signedIn ||
							(this.table === 'site_content' ? row.key !== 'website.draft' : row.is_published)
					);
		rows = rows.filter((row) => this.filters.every(([field, value]) => row[field] === value));
		if (this.mode === 'insert') {
			const timestamp = revision(state);
			const row = {
				id: crypto.randomUUID(),
				is_published: false,
				sort_order: 0,
				...structuredClone(this.payload),
				created_at: timestamp,
				updated_at: timestamp
			};
			(state[this.table] ??= []).push(row);
			rows = [row];
		} else if (this.mode === 'update') {
			for (const row of rows)
				Object.assign(row, structuredClone(this.payload), { updated_at: revision(state) });
		} else if (this.mode === 'delete') {
			state[this.table] = state[this.table].filter((row) => !rows.includes(row));
			return ok(null);
		}
		if (this.sorting) {
			const { field, ascending } = this.sorting;
			rows.sort(
				(a, b) =>
					(typeof a[field] === 'number' && typeof b[field] === 'number'
						? Number(a[field]) - Number(b[field])
						: String(a[field]).localeCompare(String(b[field]))) * (ascending ? 1 : -1)
			);
		}
		const count = rows.length;
		if (this.maximum !== undefined) rows = rows.slice(0, this.maximum);
		return ok(this.head ? null : this.singular ? (rows[0] ?? null) : rows, count);
	}
	async execute() {
		if (this.mode !== 'read') return mutate((state) => this.apply(state));
		await pendingWrite;
		return this.apply(await readState());
	}
	then(fulfilled: (result: Result) => unknown, rejected?: (reason: unknown) => unknown) {
		return this.execute().then(fulfilled, rejected);
	}
}

/** Resolves `<bucket>/<user>/<file>` inside the media folder, rejecting traversal. */
function mediaPath(key: string) {
	if (!/^(site|testimonials|transformations)\/[a-f0-9-]+\/[a-f0-9-]+\.[a-z0-9]+$/i.test(key))
		throw new Error('Invalid local image path.');
	const mediaRoot = resolve(root, 'images'),
		destination = resolve(mediaRoot, key);
	if (!destination.startsWith(mediaRoot + sep)) throw new Error('Invalid local image path.');
	return destination;
}
export async function readDemoImage(key: string) {
	const location = mediaPath(key);
	const [body, metadata] = await Promise.all([
		readFile(location),
		readFile(location + '.json', 'utf8')
	]);
	return { body: new Uint8Array(body), type: JSON.parse(metadata).type as string };
}

/** A Supabase-compatible client backed by the local demo store. */
export function createDemoClient(signedIn: boolean): SupabaseClient {
	return {
		auth: {
			getUser: async () => ({
				data: {
					user: signedIn
						? ({
								id: demoId,
								email: 'local-demo@configains.test',
								role: 'authenticated',
								aud: 'authenticated',
								app_metadata: {},
								user_metadata: {},
								created_at: '2026-10-03T00:00:00Z'
							} as User)
						: null
				},
				error: null
			})
		},
		from: (table: string) => new Query(table, signedIn),
		// Mirrors the save_website_draft and publish_website_content database functions.
		rpc: (name: string, args: Record<string, unknown>) => {
			if (!signedIn) return Promise.resolve(denied());
			return mutate((state) => {
				const rows = state.site_content,
					draft = rows.find((row) => row.key === 'website.draft');
				if ((draft?.updated_at ?? null) !== args.expected_revision) return conflict();
				const updated_at = revision(state);
				if (name === 'save_website_draft') {
					if (draft) Object.assign(draft, { metadata: structuredClone(args.content), updated_at });
					else
						rows.push({
							id: crypto.randomUUID(),
							key: 'website.draft',
							metadata: structuredClone(args.content),
							updated_at
						});
				} else if (name === 'publish_website_content' && draft) {
					const published = rows.find((row) => row.key === 'website');
					if (published)
						Object.assign(published, { metadata: structuredClone(draft.metadata), updated_at });
					else
						rows.push({
							id: crypto.randomUUID(),
							key: 'website',
							metadata: structuredClone(draft.metadata),
							updated_at
						});
				} else
					return {
						data: null,
						error: { code: '400', message: 'Invalid local publication request.' }
					};
				return ok(updated_at);
			});
		},
		storage: {
			from: (bucket: string) => ({
				upload: async (path: string, file: File) => {
					if (!signedIn) return denied();
					const location = mediaPath(bucket + '/' + path);
					await mkdir(dirname(location), { recursive: true });
					await writeFile(location, new Uint8Array(await file.arrayBuffer()));
					await writeFile(location + '.json', JSON.stringify({ type: file.type }));
					return ok({ path });
				},
				getPublicUrl: (path: string) => ({
					data: { publicUrl: '/api/local-media/' + bucket + '/' + path }
				})
			})
		}
	} as unknown as SupabaseClient;
}
