



import React, { FormEvent, Dispatch, useState, useContext } from 'react'
import axios, { AxiosResponse } from 'axios'

import GitHubContext from '../../services/githubcontext'
import { GitHubAuth } from '../../types/githubauth'



interface Props {
	path: string
}


export default (props: Props) => {
	const authenticator: GitHubAuth = useContext<GitHubAuth>(GitHubContext)
	const [username, setUsername]: [string, Dispatch<string>] = useState<string>('')
	const query = {
		query: `query($username: String!) {
			user(login: $username) {
				id
				name
				login
				avatarUrl
				followers {
					totalCount
				}
				following {
					totalCount
				}
				repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
					totalCount
					edges {
						node {
							id
							name
							description
							url
							isPrivate
							pushedAt
							stargazers {
								totalCount
							}
							forkCount
							languages(first: 1) {
								edges {
									node {
										name
									}
								}
							}
						}
					}
				}
				organizations(first: 100) {
					edges {
						node {
							avatarUrl
							id
							login
						}
					}
				}
			}
		}`,
		variables: {
			username: username
		}
	}
	console.log('GITHUB', authenticator.token)
	return (
		<div>
			<h3>GitHub Page</h3>
			<p>Use OAuth to access the GitHub API directly!</p>
			{authenticator.token ? (
				<button onClick={authenticator.signout}>Logout</button>
			) : authenticator.error ? (
				<><p>An error!</p><pre>{JSON.stringify(authenticator.error, null, 2)}</pre></>
			) : (
				<button onClick={authenticator.authenticate}>Login</button>
			)}
			<section>
				{!authenticator.token ? <p></p> : (
					<form onSubmit={async (event: FormEvent) => {
						event.preventDefault()
						const url: string = 'https://api.github.com/graphql'
						const headers: object = { Authorization: `Bearer ${authenticator.token}` }
						try {
							const graphql: AxiosResponse = await axios.post(url, query, { headers })
							console.log(graphql)
						} catch (error) {
							console.error(error)
						}
					}}>
						<input type="text" placeholder="Enter a GitHub username"
							onChange={event => setUsername(event.target.value.trim())}
						/>
						<button type="submit">Go</button>
					</form>
				)}
			</section>
		</div>
	)
}


