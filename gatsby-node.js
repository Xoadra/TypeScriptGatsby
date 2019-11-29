



/**
 * Implement Gatsby's Node APIs in this file.
 * 
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it


const TypeScriptCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')



exports.onCreateWebpackConfig = ({ stage, actions }, options) => {
	if (stage === 'develop') {
		actions.setWebpackConfig({
			plugins: [
				new TypeScriptCheckerWebpackPlugin({ ...options })
			]
		})
	}
}



