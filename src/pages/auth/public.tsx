



import React, { Dispatch, useState, useEffect, useContext } from 'react'
import axios, { AxiosResponse } from 'axios'

import Document from '../../components/document'
import GitHubContext from '../../services/githubcontext'
import { GitHubAuth } from '../../types/githubauth'



interface Props {
	path: string
}


export default (props: Props) => {
	const authenticator: GitHubAuth = useContext(GitHubContext)
	const [html, setHtml]: [string, Dispatch<string>] = useState('')
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
				const headers: object = { 'Authorization': `Bearer ${authenticator.token}` }
				const graphql: AxiosResponse = await axios.post(url, query, { headers })
				const netlify: AxiosResponse = await axios.post('/.netlify/functions/remark', graphql)
				setHtml(netlify.data.markdownRemark.html)
			})()
		}
	})
	return (
		<div>
			<h3>Public Page</h3>
			<p>Very public. No privacy whatsoever. Sad!</p>
			{html ? <Document html={html}/> : <p>Loading...</p>}
		</div>
	)
}



