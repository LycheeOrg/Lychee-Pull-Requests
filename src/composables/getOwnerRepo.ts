export function useOwnerRepo() {
	function getOwnerRepo(): { owner: string; repo: string } {
		const search = window.location.hash;
		const [owner, repo] = search.replace('#', '').split('/');
		return {
			owner: owner || 'LycheeOrg',
			repo: repo || 'Lychee',
		};
	}

	const { owner, repo } = getOwnerRepo();

	function formatOwnerRepo(): string {
		if (isLychee()) {
			return 'Lychee';
		}
		return `${owner}/${repo}`;
	}

	function isLychee(): boolean {
		return owner === 'LycheeOrg' && repo === 'Lychee';
	}

	function getReviewers(): string[] {
		if (isLychee()) {
			return ['JasonMillward', 'ppshobi', 'ildyria', 'RonnieTaz', 'sancsin', 'd7415'];
		}
		return [];
	}

	return {
		owner,
		repo,
		formatOwnerRepo,
		isLychee,
		getReviewers,
	};
}
