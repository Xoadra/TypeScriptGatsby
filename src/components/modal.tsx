



import React, { RefObject, Dispatch, MouseEvent, FormEvent, ChangeEvent, useRef, useState, useEffect } from 'react'
import GoTrue, { User } from 'gotrue-js'

import './modal.css'



interface Props {
	authenticator: GoTrue
	isToggled: boolean
	toggle(open: boolean): void
}


export default (props: Props) => {
	const modalBoundary: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)
	const { authenticator }: { authenticator: GoTrue } = props
	const loginStatus: boolean = authenticator.currentUser() ? true : false
	const [message, setMessage]: [string, Dispatch<string>] = useState<string>('')
	const [name, setName]: [string, Dispatch<string>] = useState<string>('')
	const [email, setEmail]: [string, Dispatch<string>] = useState<string>('')
	const [password, setPassword]: [string, Dispatch<string>] = useState<string>('')
	const [isSignup, setIsSignup]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isReset, setIsReset]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isLoading, setIsLoading]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isError, setIsError]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	// Temporary for testing the logged in modal UI until true authentication is implemented
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<boolean>] = useState<boolean>(loginStatus)
	const submitText: string = isReset ? 'Send recovery email' : isSignup ? 'Sign up' : 'Log in'
	const loadText: string = isReset ? 'Sending recovery email' : isSignup ? 'Signing up' : 'Logging in'
	useEffect(() => {
		if (isLoading) {
			const timeout: Timeout = setTimeout(() => {
				setIsLoading(false)
				if (!isSignup) {
					setIsAuthenticated(isReset ? isAuthenticated : !isAuthenticated)
				}
			}, 4000)
			return (): void => clearTimeout(timeout)
		}
	}, [])
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
								try {
									const recovery: void = await authenticator.requestPasswordRecovery(email)
									console.log('Success!', recovery)
									setMessage(
										'We\'ve sent a recovery email to your account, follow the link there to reset your password.'
									)
								} catch (error) {
									setIsError(true)
									console.error(`Error sending recovery mail: ${error}`)
									setMessage(error.message)
								} finally {
									setIsLoading(false)
								}
							} else if (isSignup) {
								const metadata: object = { full_name: name, best_food: 'pizza' }
								try {
									const creation: User = await authenticator.signup(email, password, metadata)
									console.log('Success!', creation)
									setMessage(
										'A confirmation message was sent to your email, click the link there to continue.'
									)
									// If autoconfirming signups is desired, add a user login step here
								} catch (error) {
									setIsError(true)
									console.error(`Error signing up user: ${error}`)
									setMessage(error.message)
								} finally {
									setIsLoading(false)
								}
							} else if (!isAuthenticated) {
								try {
									const user: User = await authenticator.login(email, password, true)
									console.log('Success!', user)
									setMessage('')
									setIsAuthenticated(true)
								} catch (error) {
									setIsError(true)
									const issue: string = error?.json.error_description || error.message
									console.error(`Error logging in user: ${issue}`)
									setMessage(error?.json.error_description || error.message || error.toString())
								} finally {
									setIsLoading(false)
								}
							} else {
								setIsAuthenticated(false)
								setIsLoading(false)
							}
						}}>
							{message && (
								<div className={isError ? 'error' : ''}>
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
										{authenticator.currentUser()?.user_metadata.full_name || 'Name'}
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
								<button id="github" onClick={() => null}>
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



