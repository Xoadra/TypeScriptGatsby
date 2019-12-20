



module.exports = ((markdown, fieldset) => {
	const promises = Object.entries(fieldset).map(([key, value]) => {
		return new Promise((resolve, reject) => {
			//Custom args aren't being used yet, so this will need to be updated
			const params = Object.entries(value.args || {}).reduce((args, [name, input]) => {
				const argument = typeof input === 'object' && 'defaultValue' in input
				return { ...args, ...(argument ? { [name]: input.defaultValue } : {}) }
			}, {})
			const field = value.resolve(markdown, params)
			const resolver = data => resolve({ [key]: data })
			field instanceof Promise ? field.then(resolver) : resolver(field)
		})
	})
	return new Promise((resolve, reject) => {
		Promise.all(promises).then(resolution => {
			resolve(resolution.reduce((node, field) => ({ ...node, ...field }), markdown))
		})
	})
})


