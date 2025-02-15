



import React, { Dispatch, useState, useEffect } from 'react'
import axios, { AxiosResponse } from 'axios'

import Document from '../../components/document'



interface Props {
	path: string
	token: string | null
}


export default (props: Props) => {
	const [html, setHtml]: [string, Dispatch<string>] = useState<string>('')
	const [error, setError]: [Error | null, Dispatch<Error | null>] = useState<Error | null>(null)
	const query: object = {
		query: `query($owner: String!, $name: String!, $expression: String!) {
			repository(owner: $owner, name: $name) {
				object(expression: $expression) {
					... on Blob {
						id
						oid
						text
					}
				}
			}
		}`,
		variables: {
			owner: 'Xoadra',
			name: 'IanPortfolio',
			expression: 'master:README.md'
		}
	}
	useEffect(() => {
		if (!html) {
			(async () => {
				const url: string = 'https://api.github.com/graphql'
				const headers: object = { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN || props.token}` }
				try {
					const graphql: AxiosResponse = await axios.post(url, query, { headers })
					const netlify: AxiosResponse = await axios.post('/.netlify/functions/remark', graphql)
					setHtml(netlify.data.markdownRemark.html)
				} catch (issue) {
					setError(issue)
				}
			})()
		}
	}, [])
	return (
		<div>
			<h3>Public Page</h3>
			<p>Very public. No privacy whatsoever. Sad!</p>
			{html ? <Document html={html}/> : error ? <p>{error.message}</p> : <p>Loading...</p>}
		</div>
	)
}


