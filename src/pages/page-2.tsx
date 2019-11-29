



import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'



export default () => (
	<Layout>
		<SEO title="Page Two"/>
		<h1>Hi from the second page</h1>
		<p>Welcome to Page 2</p>
		<Link to="/">Go back to the homepage</Link>
	</Layout>
)



