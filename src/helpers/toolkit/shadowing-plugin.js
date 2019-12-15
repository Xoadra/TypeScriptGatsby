



const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const debug = require('debug')('gatsby:component-shadowing')



const pathWithoutExtension = fullPath => {
	const parsed = path.parse(fullPath)
	return path.join(parsed.dir, parsed.name)
}


class GatsbyThemeComponentShadowingResolverPlugin {
	
	cache = {}
	
	
	constructor({ projectRoot, themes, extensions }) {
		debug('themes list', themes.map(({ themeName }) => themeName))
		this.themes = themes
		this.projectRoot = projectRoot
		this.extensions = extensions
	}
	
	
	apply(resolver) {
		resolver.hooks.relative.tapAsync(
			'GatsbyThemeComponentShadowingResolverPlugin',
			(request, stack, callback) => {
				const matchingThemes = this.getMatchingThemesForPath(request.path)
				if (matchingThemes.length > 1) {
					throw new Error(`
						Gatsby can't differentiate between themes ${matchingThemes.map(theme => (
							theme.themeName
						)).join(' and ')} for path ${request.path}
					`)
				}
				if (matchingThemes.length !== 1) {
					return callback()
				}
				const [theme] = matchingThemes
				const [, component] = request.path.split(
					path.join(theme.themeDir, 'src')
				)
				if (
					request.context.issuer &&
					this.requestPathIsIssuerShadowPath({
						requestPath: request.path,
						issuerPath: request.context.issuer,
						userSiteDir: this.projectRoot
					})
				) {
					return resolver.doResolve(
						resolver.hooks.describedRelative,
						request,
						null,
						{},
						callback
					)
				}
				const builtComponentPath = this.resolveComponentPath({
					matchingTheme: theme.themeName,
					themes: this.themes,
					component
				})
				return resolver.doResolve(
					resolver.hooks.describedRelative,
					{ ...request, path: builtComponentPath || request.path },
					null,
					{},
					callback
				)
			}
		)
	}
	
	resolveComponentPath({ matchingTheme: theme, themes: ogThemes, component }) {
		const themes = ogThemes.filter(({ themeName }) => themeName !== theme)
		return [path.join(this.projectRoot, 'src', theme)].concat(
			Array.from(themes).reverse().map(({ themeDir }) => (
				path.join(themeDir, 'src', theme)
			))
		).map(dir => path.join(dir, component)).find(possibleComponentPath => {
			debug('possibleComponentPath', possibleComponentPath)
			let dir
			try {
				dir = fs.readdirSync(path.dirname(possibleComponentPath))
			} catch (e) {
				return false
			}
			const existsDir = dir.map(filepath => path.basename(filepath))
			const exists =
				existsDir.includes(path.basename(possibleComponentPath)) ||
				this.extensions.find(ext =>
					existsDir.includes(path.basename(possibleComponentPath) + ext)
				)
			return exists
		})
	}
	
	getMatchingThemesForPath(filepath) {
		const allMatchingThemes = this.themes.filter(({ themeDir }) => (
			filepath.includes(path.join(themeDir, 'src'))
		))
		return _.uniqBy(allMatchingThemes, 'themeName')
	}
	
	getBaseShadowDirsForThemes(theme) {
		return Array.from(this.themes).reverse().map(({ themeName, themeDir }) => {
			if (themeName === theme) {
				return path.join(themeDir, 'src')
			} else {
				return path.join(themeDir, 'src', theme)
			}
		})
	}
	
	requestPathIsIssuerShadowPath({ requestPath, issuerPath, userSiteDir }) {
		const matchingThemes = this.getMatchingThemesForPath(requestPath)
		if (matchingThemes.length !== 1) {
			return false
		}
		const [theme] = matchingThemes
		const [, component] = requestPath.split(path.join(theme.themeDir, 'src'))
		const shadowFiles = this.getBaseShadowDirsForThemes(theme.themeName).concat(
			path.join(userSiteDir, 'src', theme.themeName)
		).map(dir => path.join(dir, component))
		return shadowFiles.includes(pathWithoutExtension(issuerPath))
	}
	
}


module.exports = GatsbyThemeComponentShadowingResolverPlugin


