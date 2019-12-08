



export interface GitHubAuth {
	token: string | null
	error: any
	authenticate(): void
	signout(): void
}



