



module.exports = {
	siteMetadata: {
		title: 'Gatsby Default Starter With TypeScript',
		author: '',
		description: 'Kick off your next, great Gatsby project with this default starter. This barebones starter ships with the main Gatsby configuration files you might need. TypeScript added!',
	},
	plugins: [
		'gatsby-plugin-react-helmet',
		'gatsby-plugin-typescript',
		{
			resolve: 'gatsby-source-filesystem',
			options: {
				name: 'images',
				path: `${__dirname}/src/images`,
			},
		},
		{
			resolve: 'gatsby-source-filesystem',
			options: {
				name: 'markdown',
				path: `${__dirname}/src/markdown`,
			},
		},
		'gatsby-transformer-sharp',
		'gatsby-plugin-sharp',
		'gatsby-transformer-remark',
		{
			resolve: 'gatsby-plugin-manifest',
			options: {
				name: 'gatsby-starter-default',
				short_name: 'starter',
				start_url: '/',
				background_color: '#663399',
				theme_color: '#663399',
				display: 'minimal-ui',
				icon: 'src/images/gatsby-icon.png', // This path is relative to the root of the site.
			},
		},
		// this (optional) plugin enables Progressive Web App + Offline functionality
		// To learn more, visit: https://gatsby.dev/offline
		// 'gatsby-plugin-offline',
		{
			resolve: 'gatsby-plugin-netlify-cms',
			options: {
				modulePath: `${__dirname}/src/admin/cms.ts`,
				manualInit: true,
				publicPath: 'identity'
			}
		}
	]
}


