



const path = require('path')
const { kebabCase } = require('lodash')

const { store } = require('../redux/store')



module.exports = componentPath => {
	const program = store.getState().program
	let directory = '/'
	if (program && program.directory) {
		directory = program.directory
	}
	const name = path.relative(directory, componentPath)
	return `component---${kebabCase(name)}`
}



