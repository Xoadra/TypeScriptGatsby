



/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 * 
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */


import React from 'react'
import Helmet from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

import { Meta } from '../types/meta'



interface Props {
	title: string
	lang?: string
	description?: string
	//meta?: Array<{ name: string; content: string }>
	//meta?: Array<Meta>
	meta?: Meta[]
	//keywords?: Array<string>
	keywords?: string[]
}


export default (props: Props) => {
	const { site }: any = useStaticQuery(graphql`
		query {
			site {
				siteMetadata {
					title
					description
					author
				}
			}
		}
	`)
	const { title = '', lang = 'en', meta = [] }: { title?: string, lang?: string, meta?: Meta[] } = props
	const { description }: { description?: string } = props || site.siteMetadata
	return (
		<Helmet 
			htmlAttributes={{ lang }} title={title} titleTemplate={`%s | ${site.siteMetadata.title}`}
			meta={[
				{ name: 'description', content: description },
				{ property: 'og:title', content: title },
				{ property: 'og:description', content: description },
				{ property: 'og:type', content: 'website' },
				{ name: 'twitter:card', content: 'summary' },
				{ name: 'twitter:creator', content: site.siteMetadata.author },
				{ name: 'twitter:title', content: title },
				{ name: 'twitter:description', content: description }
			].concat(meta)}
		/>
	)
}



