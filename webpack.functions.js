



const TypeScriptCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const reporter = require('gatsby-cli/lib/reporter')



class NetlifyFunctionWatcherPlugin {
	
	constructor(options = {}) {
		this.initialBuild = true
		this.logger = options.logger || console
	}
	
	
	apply(compiler) {
		let analyzeActivity
		let webpackActivity
		const pluginName = 'NetlifyFunctionWatcherPlugin'
		compiler.hooks.watchRun.tapAsync(pluginName, (compiler, callback) => {
			if (webpackActivity) {
				webpackActivity.end()
			}
			if (!this.initialBuild && this.logger.activityTimer) {
				analyzeActivity = this.logger.activityTimer('analyzing modified functions', {})
				webpackActivity = this.logger.activityTimer('Re-building development bundle', {})
				analyzeActivity.start()
				webpackActivity.start()
			}
			callback()
			if (!this.initialBuild) {
				if (analyzeActivity) {
					analyzeActivity.end()
					analyzeActivity = null
				}
				this.logger.info('Type checking in progress...')
			}
		})
		compiler.hooks.done.tapAsync(pluginName, (stats, callback) => {
			if (webpackActivity) {
				webpackActivity.end()
				webpackActivity = null
			}
			// Bypass bug in netlify-lambda that prevents silencing output
			stats.originalToString = stats.toString
			stats.toString = () => stats.originalToString(stats.compilation.options.stats)
			callback()
			// Reset the stats.toString method back to the original one
			stats.toString = stats.originalToString
			delete stats.originalToString
			if (this.initialBuild) {
				this.initialBuild = false
			}
		})
	}
	
}


module.exports = {
	stats: {
		assets: false,
		builtAt: false,
		entrypoints: false,
		hash: false,
		modules: false,
		timings: false,
		version: false
	},
	plugins: process.env.NODE_ENV === 'production' ? [] : [
		new NetlifyFunctionWatcherPlugin({
			logger: reporter
		}),
		new TypeScriptCheckerWebpackPlugin({
			logger: reporter,
			tsconfig: '../tsconfig.json'
		})
	]
}


