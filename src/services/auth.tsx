



import React, { Dispatch, useState, useContext } from 'react'
import netlifyIdentity from 'netlify-identity-widget'



interface NetlifyAuth {
	isAuthenticated: boolean
	user: object | null
	setUser?(user: object | null): any
	authenticate(callback?: any): void
	signout(callback?: any): void
}


const AuthContext = React.createContext<NetlifyAuth>({
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
		this.isAuthenticated = false
		netlifyIdentity.logout()
		netlifyIdentity.on('logout', () => {
			this.user = null
			callback(this.user)
		})
	}
})


export const AuthProvider = (props: any) => {
	const [user, setUser]: [object | null, Dispatch<null>] = useState(null)
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<false>] = useState(false)
	const { Provider } = AuthContext
	const netlifyAuth = useContext(AuthContext)
	return (
		<Provider value={{ ...netlifyAuth, user, setUser }}>
			{props.children}
		</Provider>
	)
}

export default AuthContext


