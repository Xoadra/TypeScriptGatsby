



/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 * 
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */


import React, { Fragment, ReactNode } from 'react'
import { useStaticQuery, graphql } from 'gatsby'

import Header from './header'
import './layout.css'



interface Props {
	children: ReactNode
}


export default (props: Props) => {
	const data = useStaticQuery(graphql`
		query {
			site {
				siteMetadata {
					title
				}
			}
		}
	`)
	return (
		<Fragment>
			<Header siteTitle={data.site.siteMetadata.title} />
			<div style={{ maxWidth: 960, padding: '0 1.0875rem 1.45rem', margin: '0 auto' }}>
				<main>{props.children}</main>
				<footer>
					© {new Date().getFullYear()}, Built with
					{' '}
					<a href="https://www.gatsbyjs.org">Gatsby</a>
				</footer>
			</div>
		</Fragment>
	)
}


