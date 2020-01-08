



import React, { RefObject, Dispatch, MouseEvent, FormEvent, useRef, useState } from 'react'

import './modal.css'



interface Props {
	isToggled: boolean
	toggle(open: boolean): void
}


export default (props: Props) => {
	const modalBoundary: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)
	const [isSignup, setIsSignup]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	return (
		<div style={{ position: 'fixed', zIndex: 100, background: '#0e1e25b0', height: '100%', width: '100%' }}>
			<div id="fade" onClick={() => {
				const { current }: { current: HTMLDivElement | null } = modalBoundary
				props.toggle(current?.clientWidth === current?.parentElement?.clientWidth)
			}}>
				<div ref={modalBoundary}>
					<div id="modal" onClick={(event: MouseEvent) => event.stopPropagation()}>
						<button onClick={() => props.toggle(false)}/>
						<div>
							<button className={isSignup ? 'active' : ''} onClick={() => setIsSignup(true)}>
								Sign up
							</button>
							<button className={isSignup ? '' : 'active'} onClick={() => setIsSignup(false)}>
								Log in
							</button>
						</div>
						<form onSubmit={(event: FormEvent) => event.preventDefault()}>
							{isSignup && (
								<fieldset>
									<label>
										<input type="name" placeholder="Name" required/>
										<div id="name"/>
									</label>
								</fieldset>
							)}
							<fieldset>
								<label>
									<input type="email" placeholder="Email" required/>
									<div id="email"/>
								</label>
							</fieldset>
							<fieldset>
								<label>
									<input type="password" placeholder="Password" required/>
									<div id="password"/>
								</label>
							</fieldset>
							{isSignup ? (
								<button type="submit">Sign up</button>
							) : (
								<button type="submit">Log in</button>
							)}
						</form>
						{!isSignup && (
							<button onClick={() => null}>
								Forgot password?
							</button>
						)}
						<div>
							<hr/>
							<button id="github" onClick={() => null}>
								Continue with GitHub
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}



