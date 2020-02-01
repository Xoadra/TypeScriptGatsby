



import React, { Dispatch, FormEvent, ChangeEvent, useState, useContext } from 'react'
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
	return (
		<div>
			<h3>GitHub Page</h3>
			<p>Use OAuth to access the GitHub API directly!</p>
			{/* authenticator.token ? (
				<button onClick={authenticator.signout}>Logout</button>
			) : authenticator.error ? (
				<><p>An error!</p><pre>{JSON.stringify(authenticator.error, null, 2)}</pre></>
			) : (
				<button onClick={authenticator.authenticate}>Login</button>
			) */}
			<section>
				{/* !authenticator.token ? <p/> : */ (
					<form onSubmit={async (event: FormEvent) => {
						event.preventDefault()
						const url: string = 'https://api.github.com/graphql'
						//const headers: object = { Authorization: `Bearer ${authenticator.token}` }
						const headers: object = { Authorization: `Bearer ${localStorage.getItem('github-token')}` }
						try {
							const graphql: AxiosResponse = await axios.post(url, query, { headers })
							console.log(graphql)
						} catch (error) {
							console.error(error)
						}
					}}>
						<input value={username} type="text" placeholder="Enter a GitHub username"
							onChange={(event: ChangeEvent<HTMLInputElement>) => {
								setUsername(event.target.value.trim())
							}}
						/>
						<button type="submit">Go</button>
					</form>
				)}
			</section>
		</div>
	)
}


