



import netlifyIdentity from 'netlify-identity-widget'



interface NetlifyAuth {
	isAuthenticated: boolean
	user: object | null
	authenticate(callback: any): void
	signout(callback: any): void
}


export const netlifyAuth: NetlifyAuth = {
	isAuthenticated: false,
	user: null,
	authenticate: function(callback: any): void {
		this.isAuthenticated = true
		netlifyIdentity.open()
		netlifyIdentity.on('login', (user: object) => {
			this.user = user
			callback(this.user)
		})
	},
	signout: function(callback: any): void {
		this.isAuthenticated = false;
		netlifyIdentity.logout()
		netlifyIdentity.on('logout', () => {
			this.user = null
			callback(this.user)
		})
	}
}



