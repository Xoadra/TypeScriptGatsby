



const { parse, Kind: GraphQLASTNodeKind } = require('graphql')
/* const report = require('gatsby-cli/lib/reporter') */

const { inferExtensionName, dontInferExtensionName } = require('./schema-extensions')
const { isGatsbyType } = require('./type-builders')



const isASTDocument = typeOrTypeDef => (
	typeof typeOrTypeDef === 'object' &&
	typeOrTypeDef.kind &&
	GraphQLASTNodeKind.DOCUMENT === typeOrTypeDef.kind
)


const parseTypeDef = typeOrTypeDef => {
	if (typeof typeOrTypeDef === 'string') {
		try {
			return parse(typeOrTypeDef)
		} catch (error) {
			reportParsingError(error)
		}
	}
	return typeOrTypeDef
}


const reportParsingError = error => {
	const { message, source, locations } = error
	if (source && locations && locations.length) {
		const { codeFrameColumns } = require('@babel/code-frame')
		const frame = codeFrameColumns(
			source.body,
			{ start: locations[0] },
			{ linesAbove: 5, linesBelow: 5 }
		)
		/* report.panic(
			'Encountered an error parsing the provided GraphQL type definitions:\n' +
			message + '\n\n' + frame + '\n'
		) */
		throw new Error(
			'Encountered an error parsing the provided GraphQL type definitions:\n' +
			message + '\n\n' + frame + '\n'
		)
	} else {
		throw error
	}
}


const typesWithoutInference = (typeNames = [], typeOrTypeDef) => {
	if (typeof typeOrTypeDef === 'string') {
		typeOrTypeDef = parseTypeDef(typeOrTypeDef)
	}
	if (isASTDocument(typeOrTypeDef)) {
		typeOrTypeDef.definitions.forEach(def => {
			if (!def.directives) return
			def.directives.forEach(directive => {
				if (directive.name.value === dontInferExtensionName) {
					const noDefaultResolversArg = (directive.arguments || []).find(arg => 
						arg.name.value === 'noDefaultResolvers'
					)
					const shouldAddDefaultResolver =
						noDefaultResolversArg &&
						noDefaultResolversArg.value &&
						noDefaultResolversArg.value.value === false
					if (!shouldAddDefaultResolver && def.name.value) {
						typeNames.push(def.name.value)
					}
				}
			})
		})
		return typeNames
	}
	if (isGatsbyType(typeOrTypeDef) && typeOrTypeDef.config) {
		const { extensions = {}, name } = typeOrTypeDef.config
		if (
			name &&
			(
				extensions[dontInferExtensionName] ||
				extensions[inferExtensionName] === false
			)
		) {
			if (!extensions.addDefaultResolvers) {
				typeNames.push(name)
			}
		}
	}
	return typeNames
}


module.exports = {
	parseTypeDef,
	reportParsingError,
	typesWithoutInference,
	isASTDocument
}



