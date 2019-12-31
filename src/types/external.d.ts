



declare module 'netlify-auth-providers' {
	
	interface NetlifyErrorDefinition {
		message: string
	}
	
	class NetlifyError {
		err: NetlifyErrorDefinition
		constructor(err: NetlifyErrorDefinition)
		toString(): string
	}
	
	/* interface Provider {
		width: number
		height: number
	}
	
	interface Providers {
		github: Provider
		gitlab: Provider
		bitbucket: Provider
		email: Provider
	} */
	
	interface Options {
		provider: string
		scope?: string
		login?: boolean
		beta_invite?: string
		invite_code?: string
	}
	
	interface Config {
		site_id?: string
		base_url?: string
	}
	
	interface Data {
		token: string
		provider: string
	}
	
	type EventCallback = (e: MessageEvent) => void
	type NetlifyCallback = (error: NetlifyError | null, data: Data) => void
	
	export default class Authenticator {
		site_id?: string
		base_url: string
		authWindow: Window | null
		constructor(config: Config)
		handshakeCallback(options: Options, cb: NetlifyCallback): EventCallback
		authorizeCallback(options: Options, cb: NetlifyCallback): EventCallback
		getSiteID(): string | null
		authenticate(options: Options, cb: NetlifyCallback): void
	}
	
}


declare module 'netlify-cms-app'



