



import React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'
import Image from '../components/image'
import SEO from '../components/seo'
import Document from '../components/document'
import { Remark } from '../types/remark'



interface Props {
	data: Remark
}


export default (props: Props) => (
	<Layout>
		<SEO title="Home"/>
		<h1>Hi people</h1>
		<p>Welcome to your new Gatsby site.</p>
		<p>Now go build something great.</p>
		<Link to="/remote">Remote</Link>
		<Link to="/auth">Auth</Link>
		<Link to="/within/static">Static</Link>
		<Link to="/within/dynamic">Dynamic</Link>
		<Document html={props.data.markdownRemark.html}/>
		<div style={{ maxWidth: '300px', marginBottom: '1.45rem' }}>
			<Image/>
		</div>
	</Layout>
)


export const query = graphql`
	query {
		markdownRemark(fileAbsolutePath: { ne: null }) {
			html
		}
	}
`


