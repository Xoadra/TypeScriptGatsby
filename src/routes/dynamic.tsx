



import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'



interface Props {
	path: string
}


export default (props: Props) => (
	<Layout>
		<SEO title="Dynamic"/>
		<h1>Hi from nested Dynamic Page</h1>
		<Link to="/">Home</Link>
	</Layout>
)



