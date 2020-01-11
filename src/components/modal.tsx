



import React, { RefObject, Dispatch, MouseEvent, FormEvent, useRef, useState, useEffect } from 'react'

import './modal.css'



interface Props {
	isToggled: boolean
	toggle(open: boolean): void
}


export default (props: Props) => {
	const modalBoundary: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)
	const [isSignup, setIsSignup]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isReset, setIsReset]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isLoading, setIsLoading]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	// Temporary for testing the logged in modal UI until true authentication is implemented
	const [isAuthenticated, setIsAuthenticated]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const submitText: string = isReset ? 'Send recovery email' : isSignup ? 'Sign up' : 'Log in'
	const loadText: string = isReset ? 'Sending recovery email' : isSignup ? 'Signing up' : 'Logging in'
	useEffect(() => {
		if (isLoading) {
			const timeout: Timeout = setTimeout(() => {
				setIsLoading(false)
				setIsAuthenticated(isReset ? isAuthenticated : !isAuthenticated)
			}, 4000)
			return (): void => clearTimeout(timeout)
		}
	})
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
								<button className={isSignup ? 'active' : ''} onClick={() => setIsSignup(true)}>
									Sign up
								</button>
								<button className={isSignup ? '' : 'active'} onClick={() => setIsSignup(false)}>
									Log in
								</button>
							</div>
						) : (
							<div>
								<span className="active">Logged in</span>
							</div>
						)}
						<form className={isLoading ? 'load' : ''} onSubmit={(event: FormEvent) => {
							event.preventDefault()
							setIsLoading(true)
						}}>
							{!isAuthenticated && isSignup && (
								<fieldset>
									<label>
										<input type="name" placeholder="Name" required/>
										<div id="name"/>
									</label>
								</fieldset>
							)}
							{!isAuthenticated && (
								<fieldset>
									<label>
										<input type="email" placeholder="Email" required/>
										<div id="email"/>
									</label>
								</fieldset>
							)}
							{!isAuthenticated && !isReset && (
								<fieldset>
									<label>
										<input type="password" placeholder="Password" required/>
										<div id="password"/>
									</label>
								</fieldset>
							)}
							{isAuthenticated && (
								<p>
									Logged in as <br/>
									<span>Username</span>
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



