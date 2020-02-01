



import React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Document from '../components/document'
import { Remark } from '../types/remark'



interface Props {
	data: Remark
}


export default (props: Props) => (
	<Layout>
		<SEO title="Remote"/>
		<h1>Hi from the remote document</h1>
		<p>Welcome to the Remote Page</p>
		<Link to="/">Home</Link>
		<Document html={props.data.markdownRemark.html}/>
	</Layout>
)


export const query = graphql`
	query {
		markdownRemark(fileAbsolutePath: { eq: null }) {
			html
		}
	}
`


