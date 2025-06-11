export type User = {
	html_url: string;
	avatar_url: string;
	login: string;
};

export type PullRequest = {
	active_lock_reason: unknown;
	assignee: unknown;
	author_association: string;
	auto_merge: null;
	body: string;
	closed_at: null;
	comments_url: string;
	commits_url: string;
	created_at: string;
	diff_url: string;
	draft: boolean;
	html_url: string;
	id: number;
	issue_url: string;
	labels: { color: string; id: number; description: string; name: string }[];
	locked: boolean;
	merge_commit_sha: string;
	merged_at: null;
	milestone: null;
	node_id: string;
	number: number;
	patch_url: string;
	review_comment_url: string;
	review_comments_url: string;
	state: 'open';
	statuses_url: string;
	title: string;
	updated_at: string;
	url: string;
	user: User;
	base: { ref: string };
	head: { ref: string };
};

export const CONTRIBUTORS = ['JasonMillward', 'ppshobi', 'ildyria', 'RonnieTaz', 'sancsin', 'd7415'];
export const APPROVED = 'APPROVED';
export const CHANGES_REQUESTED = 'CHANGES_REQUESTED';
export type PullRequestReview = {
	author_association: string;
	body: string;
	commit_id: string;
	html_url: string;
	id: number;
	node_id: string;
	pull_request_url: string;
	state: string;
	submitted_at: string;
	user: User;
};

export type ReviewStatus = {
	review?: {
		approved: boolean;
		changes_requested: boolean;
		code_owner_approved: boolean;
		by: User[];
	};
};
