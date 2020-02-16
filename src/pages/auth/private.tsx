



import React, { Dispatch, FormEvent, ChangeEvent, useState, useEffect } from 'react'
import { Redirect } from '@reach/router'
//import { User } from 'netlify-identity-widget'
import { User } from 'gotrue-js'
import axios, { AxiosResponse } from 'axios'

import Editor from '../../components/editor'
import Document from '../../components/document'



interface Props {
	path: string
	user: User | null
	token: string | null
	isAuthenticated: boolean
}


export default (props: Props) => {
	const [userRepos, setUserRepos]: [object | any, Dispatch<object | any>] = useState<object | any>(null)
	const [viewer, setViewer]: [any, Dispatch<any>] = useState<any>({})
	const [repository, setRepository]: [string, Dispatch<string>] = useState<string>('')
	const [branch, setBranch]: [string, Dispatch<string>] = useState<string>('')
	const [document, setDocument]: [any, Dispatch<any>] = useState<any>({})
	const [html, setHtml]: [string, Dispatch<string>] = useState<string>('')
	const [isSubmitted, setIsSubmitted]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isLoading, setIsLoading]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [isEditing, setIsEditing]: [boolean, Dispatch<boolean>] = useState<boolean>(false)
	const [error, setError]: [Error | null, Dispatch<Error | null>] = useState<Error | null>(null)
	const fragments = (depth: number, level: number = 0): string => (
		`fragment Level${level} on GitObject {
			type: __typename
			oid
			... on Blob {
				text
			}
			... on Tree {
				entries {
					${level + 1 === depth ? 'name' : `name
					object {
						...Level${level + 1}
					}`}
				}
			}
		}
		${level + 1 >= depth ? '' : fragments(depth, level + 1)}`
	)
	const filter: string = 'first: 100, isFork: false, privacy: PUBLIC, ownerAffiliations: OWNER'
	const query = {
		query: `query${props.isAuthenticated ? '' : '($username: String!)'} {
			${props.isAuthenticated ? 'viewer' : 'user(login: $username)'} {
				login
				name
				email
				repositories(${filter}, orderBy: { field: NAME, direction: ASC }) {
					totalCount
					nodes {
						name
						url
						description
						defaultBranchRef {
							...Branch
						}
						refs(first: 25, refPrefix: "refs/heads/") {
							totalCount
							nodes {
								...Branch
							}
						}
					}
				}
			}
		}
		fragment Branch on Ref {
			name
			target {
				... on Commit {
					authoredDate
					message
					tree {
						...Level0
					}
				}
			}
		}
		${fragments(5)}`,
		variables: props.isAuthenticated ? {} : {
			username: 'Xoadra'
		}
	}
	useEffect(() => {
		(async () => {
			if (props.isAuthenticated && !isLoading && !userRepos) {
				setIsLoading(true)
				const url: string = 'https://api.github.com/graphql'
				const headers: object = { Authorization: `Bearer ${props.token}` }
				try {
					const graphql: AxiosResponse = await axios.post(url, query, { headers })
					// Query errors should be added to state eventually
					const profile: any = graphql.data.data.viewer || graphql.data.data.user
					setViewer({ login: profile.login, name: profile.name, email: profile.email })
					// Get the fetched repos and save them to state
					const repositories: any = profile.repositories.nodes.reduce((collection: any, repository: any) => {
						const branches: object = repository.refs.nodes.reduce((history: any, branch: any) => {
							return { ...history, [branch.name]: { ...branch } }
						}, {})
						repository = { ...repository, refs: { ...repository.refs, nodes: branches } }
						return { ...collection, [repository.name]: { ...repository } }
					}, {})
					setUserRepos(repositories)
				} catch (issue) {
					setError(issue)
					// More about error objects at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
					console.error('ERROR', issue, issue.name, issue.message, issue.toString())
				} finally {
					setIsLoading(false)
				}
			}
		})()
	}, [])
	return !props.isAuthenticated ? <Redirect to="/auth" noThrow/> : (
		<div>
			<h3>Private Page</h3>
			<p>You are logged in as <b>{props.user?.email || ''}</b></p>
			{isSubmitted ? isEditing ? (
				<article style={{ margin: '0 0 1.45rem' }}>
					<h4>
						Modifying <span style={{ textTransform: 'capitalize' }}>{repository}</span>'s
						README On The <span style={{ textTransform: 'capitalize' }}>{branch}</span> Branch
					</h4>
					<Editor viewer={viewer} repository={repository} branch={branch} document={document}
						token={props.token} exit={() => setIsEditing(false)} update={(ref: any) => {
							// Updated object passed in here should be saved in state
							console.log('Update succeeded!', ref, userRepos[repository].refs.nodes[branch])
						}}
					/>
				</article>
			) : (
				<article style={{ margin: '0 0 1.45rem' }}>
					<h4>
						Viewing <span style={{ textTransform: 'capitalize' }}>{repository}</span>'s
						README On The <span style={{ textTransform: 'capitalize' }}>{branch}</span> Branch
					</h4>
					{!isLoading ? error ? (
						<p>
							There is an error!<br/><br/>
							<b>{error.name}</b>: {error.message}.
						</p>
					) : (
						<Document html={html || 'No README found!  :('}/>
					) : (
						<p>Transforming the selected README file...</p>
					)}
					<button onClick={() => {
						setIsSubmitted(false)
						setRepository('')
						setBranch('')
					}}>Change Repository</button>
					{html && (
						<button onClick={() => setIsEditing(true)}>Modify Document</button>
					)}
				</article>
			) : (
				<form onSubmit={async (event: FormEvent) => {
					event.preventDefault()
					setIsSubmitted(true)
					const head: any = userRepos[repository].refs.nodes[branch]
					console.log(`Viewing branch ${branch} on repository ${repository}: `, head)
					const readme: any = head.target.tree.entries.find((entry: any) => {
						return /^(README){1}((\.){1}(\D)+)$/i.test(entry.name)
					})
					if (readme) {
						setIsLoading(true)
						const blob: any = { data: { data: { repository: readme } } }
						setDocument(blob.data.data.repository)
						try {
							const markdown: AxiosResponse = await axios.post('/.netlify/functions/remark', blob)
							setHtml(markdown.data.markdownRemark.html)
						} catch (issue) {
							setError(issue)
							console.error('Error trying to transform README file: ', issue)
						} finally {
							setIsLoading(false)
						}
					}
				}}>
					<h4>Display A GitHub Repository's README Document!</h4>
					{!userRepos ? error ? (
						<p>
							There is an error!<br/><br/>
							<b>{error.name}</b>: {error.message}.
						</p>
					) : (
						<p>Loading your repositories...</p>
					) : (
						<fieldset style={{ border: '0' }}>
							<select onChange={(event: ChangeEvent<HTMLSelectElement>) => {
								event.preventDefault()
								setRepository(event.target.value)
								setBranch('')
							}}>
								<option value="" disabled={repository ? true : false}>
									Select a Repository
								</option>
								{Object.values(userRepos).map((repo: any) => (
									<option key={repo.name} value={repo.name}>
										{repo.name}
									</option>
								))}
							</select>
							{repository && (
								<select value={branch} onChange={(event: ChangeEvent<HTMLSelectElement>) => {
									event.preventDefault()
									setBranch(event.target.value)
								}}>
									<option value="" disabled={branch ? true : false}>
										Select a Branch
									</option>
									{Object.values(userRepos[repository].refs.nodes).map((ref: any) => (
										<option key={ref.name} value={ref.name}>
											{ref.name}
										</option>
									))}
								</select>
							)}
						</fieldset>
					)}
					<button type="submit" disabled={!repository || !branch}>
						Select Repository
					</button>
				</form>
			)}
		</div>
	)
}



