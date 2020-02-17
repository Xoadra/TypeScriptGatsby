



import React, { RefObject, Dispatch, FormEvent, ChangeEvent, useRef, useState, useEffect } from 'react'
import axios, { AxiosResponse } from 'axios'

import Document from './document'



interface Props {
	viewer: { login: string, name: string, email: string }
	repository: string
	branch: string
	document: any
	token: string | null
	exit(): void
	update(ref: any): void
}


export default (props: Props) => {
	const editor: RefObject<HTMLTextAreaElement> = useRef<HTMLTextAreaElement>(null)
	const [html, setHtml]: [string, Dispatch<string>] = useState<string>('')
	// Form input data changes are buggy in that they reset the screen's position
	const [text, setText]: [string, Dispatch<string>] = useState<string>(props.document.object.text || '')
	const [message, setMessage]: [string, Dispatch<string>] = useState<string>('')
	const [isPreview, setIsPreview]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isSubmitted, setIsSubmitted]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	console.log('Opening editor...', props.document)
	useEffect(() => {
		if (editor.current) {
			// Alternative way to dynamically resize the textarea element
			/* editor.current.style.height = `${0}px`
			editor.current.style.height = `${editor.current.scrollHeight}px` */
			// Height has to be reset in order for textarea shrinkage to work
			editor.current.rows = 1
			// Integer literal 26 is the base unit per line in the textarea
			editor.current.rows = 1 + (editor.current.scrollHeight - editor.current.clientHeight) / 26
		}
	})
	return (
		<form style={{ pointerEvents: isSubmitted ? 'none' : 'auto' }} onSubmit={async (event: FormEvent) => {
			event.preventDefault()
			setIsSubmitted(true)
			// Will need changes in the future to allow nested file updates
			const path: string = `contents/${props.document.name}`
			const target: string = `${props.viewer.login}/${props.repository}`
			// GitHub's GraphQL API seems to lack a mutation for file updating
			// Make due for now by using the regular REST version of the API
			const url: string = `https://api.github.com/repos/${target}/${path}`
			const encoding: string = Buffer.from(text).toString('base64')
			const headers: object = { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${props.token}` }
			const mutation: object = { message, content: encoding, sha: props.document.object.oid, branch: props.branch }
			console.log('Submitting file content update...', mutation)
			try {
				const update: AxiosResponse = await axios.put(url, mutation, { headers })
				props.update(update)
			} catch (error) {
				console.error('File update failed!', error)
			} finally {
				setIsSubmitted(false)
			}
		}}>
			<nav>
				<button type="button" disabled={!isPreview} onClick={() => setIsPreview(false)}>Modify</button>
				<button type="button" disabled={isPreview} onClick={async () => {
					const base: any = { object: { ...props.document.object, text } }
					const raw: any = { data: { data: { repository: { ...props.document, ...base } } } }
					try {
						const document: AxiosResponse = await axios.post('/.netlify/functions/remark', raw)
						setHtml(document.data.markdownRemark.html)
						setIsPreview(true)
					} catch (error) {
						console.error('Preview failed!', error)
					}
				}}>Preview</button>
			</nav>
			{isPreview ? (
				<Document html={html}/>
			) : (
				<fieldset style={{ border: 0 }}>
					<textarea
						style={{
							background: 'powderblue', border: 0, resize: 'none', /* resize: 'vertical', */ width: '100%', padding: '1.45em', margin: '1.45rem 0'
						}}
						value={text} rows={1} ref={editor} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
							event.preventDefault()
							setText(event.target.value)
						}}
					/>
					<input
						style={{
							background: 'palegreen', border: 0, width: '100%', padding: '1.45em', margin: '-0.4em 0 0'
						}}
						value={message} placeholder="Enter your commit message here" required
						onChange={(event: ChangeEvent<HTMLInputElement>) => {
							event.preventDefault()
							setMessage(event.target.value)
						}}
					/>
				</fieldset>
			)}
			<button type="button" onClick={props.exit}>Back</button>
			<button type="submit" disabled={isSubmitted}>Save</button>
		</form>
	)
}


