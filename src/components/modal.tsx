



import React, { RefObject, Dispatch, MouseEvent, FormEvent, ChangeEvent, useRef, useState, useEffect } from 'react'
import GoTrue, { User } from 'gotrue-js'

import { NetlifyAuth } from '../types/netlifyauth'
import './modal.css'



interface Props extends NetlifyAuth {
	authenticator: GoTrue
}


export default (props: Props) => {
	const modalBoundary: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)
	const [message, setMessage]: [string, Dispatch<string>] = useState<string>('')
	const [name, setName]: [string, Dispatch<string>] = useState<string>('')
	const [email, setEmail]: [string, Dispatch<string>] = useState<string>('')
	const [password, setPassword]: [string, Dispatch<string>] = useState<string>('')
	const [isSignup, setIsSignup]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isReset, setIsReset]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isLoading, setIsLoading]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const submitText: string = isReset ? 'Send recovery email' : isSignup ? 'Sign up' : 'Log in'
	const loadText: string = isReset ? 'Sending recovery email' : isSignup ? 'Signing up' : 'Logging in'
	const { authenticator, isAuthenticated }: { authenticator: GoTrue, isAuthenticated: boolean } = props
	useEffect(() => console.log('Modal user...', props.user, props.token), [])
	return (
		<div style={{ position: 'fixed', zIndex: 100, background: '#0e1e25b0', height: '100%', width: '100%' }}>
			<div id="fade" onClick={() => {
				const { current }: { current: HTMLDivElement | null } = modalBoundary
				props.toggle(current?.clientWidth === current?.parentElement?.clientWidth)
			}}>
				<div ref={modalBoundary}>
					<div id="modal" onClick={(event: MouseEvent) => event.stopPropagation()}>
						<button onClick={() => props.toggle(false)}/>
						{!isAuthenticated ? isReset ? (
							<div>
								<span className="active">Recover password</span>
							</div>
						) : (
							<div>
								<button className={isSignup ? 'active' : ''} disabled={isLoading}
									onClick={() => setIsSignup(true)}
								>
									Sign up
								</button>
								<button className={isSignup ? '' : 'active'} disabled={isLoading}
									onClick={() => setIsSignup(false)}
								>
									Log in
								</button>
							</div>
						) : (
							<div>
								<span className="active">Logged in</span>
							</div>
						)}
						<form className={isLoading ? 'load' : ''} onSubmit={async (event: FormEvent) => {
							event.preventDefault()
							setIsLoading(true)
							if (isReset) {
								await props.recover(email, (error: Error, data: void) => {
									error ? setMessage(error.message) : setMessage(
										'We\'ve sent a recovery email to your account, follow the link there to reset your password.'
									)
								})
							} else if (isSignup) {
								const metadata: object = { full_name: name, best_food: 'pizza' }
								await props.signup([email, password, metadata], (error: Error, data: User) => {
									error ? setMessage(error.message) : setMessage(
										'A confirmation message was sent to your email, click the link there to continue.'
									)
								})
							} else if (!isAuthenticated) {
								await props.authenticate([email, password, true], (error: any, data: User) => {
									!error ? setMessage('') : setMessage(
										error?.json.error_description || error.message || error.toString()
									)
								})
							} else {
								await props.logout((error: any, data: void) => {
									!error ? setMessage('') : setMessage(
										error?.json.error_description || error.message || error.toString()
									)
								})
							}
							setIsLoading(false)
						}}>
							{message && (
								<div className={props.error ? 'error' : ''}>
									<span>{message}</span>
								</div>
							)}
							{!isAuthenticated && isSignup && (
								<fieldset>
									<label>
										<input value={name} type="name" placeholder="Name" required
											onChange={(event: ChangeEvent<HTMLInputElement>) => {
												setName(event.target.value)
											}}
										/>
										<div id="name"/>
									</label>
								</fieldset>
							)}
							{!isAuthenticated && (
								<fieldset>
									<label>
										<input value={email} type="email" placeholder="Email" required
											onChange={(event: ChangeEvent<HTMLInputElement>) => {
												setEmail(event.target.value)
											}}
										/>
										<div id="email"/>
									</label>
								</fieldset>
							)}
							{!isAuthenticated && !isReset && (
								<fieldset>
									<label>
										<input value={password} type="password" placeholder="Password" required
											onChange={(event: ChangeEvent<HTMLInputElement>) => {
												setPassword(event.target.value)
											}}
										/>
										<div id="password"/>
									</label>
								</fieldset>
							)}
							{isAuthenticated && (
								<p>
									Logged in as <br/>
									<span>
										{props.user?.user_metadata.full_name || 'Name'}
									</span>
								</p>
							)}
							<button className={isLoading ? 'load' : ''} type="submit">
								{!isAuthenticated ? (
									isLoading ? loadText : submitText
								) : (
									isLoading ? 'Logging out' : 'Log out'
								)}
							</button>
						</form>
						{!isAuthenticated && !isSignup && (!isReset ? (
							<button onClick={() => setIsReset(true)}>
								Forgot password?
							</button>
						) : (
							<button onClick={() => setIsReset(false)}>
								Never mind
							</button>
						))}
						{!isAuthenticated && !isReset && (
							<div>
								<hr/>
								<button id="github" onClick={() => {
									const url: string = authenticator.loginExternalUrl('github')
									const mode: string = process.env.NODE_ENV || 'development'
									mode === 'production' ? window.location.href = url : window.open(url)
								}}>
									Continue with GitHub
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}



