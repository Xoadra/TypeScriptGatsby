



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
	const [text, setText]: [string, Dispatch<string>] = useState<string>(props.document.object.text || '')
	const [message, setMessage]: [string, Dispatch<string>] = useState<string>('')
	const [isPreview, setIsPreview]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
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
		<form onSubmit={(event: FormEvent) => {
			event.preventDefault()
			// Unfortunately, the GitHub API seems to lack a file update mutation
		}}>
			<nav>
				<button disabled={!isPreview} onClick={() => setIsPreview(false)}>Modify</button>
				<button disabled={isPreview} onClick={async () => {
					const raw: any = { data: { data: { repository: props.document } } }
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
				<fieldset>
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
						value={message} placeholder="Enter commit message"
						onChange={(event: ChangeEvent<HTMLInputElement>) => {
							event.preventDefault()
							setMessage(event.target.value)
						}}
					/>
				</fieldset>
			)}
			<button onClick={props.exit}>Back</button>
			<button type="submit">Save</button>
		</form>
	)
}


