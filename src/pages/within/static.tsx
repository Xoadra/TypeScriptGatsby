



import React from 'react'
import { Link } from 'gatsby'

import Layout from '../../components/layout'
import SEO from '../../components/seo'



export default () => (
	<Layout>
		<SEO title="Static"/>
		<h1>Hi from nested Static Page</h1>
		<Link to="/">Home</Link>
	</Layout>
)


