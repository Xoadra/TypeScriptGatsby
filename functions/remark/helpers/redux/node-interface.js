



const SORTABLE_ENUM = {
	SORTABLE: 'SORTABLE',
	NOT_SORTABLE: 'NON_SORTABLE',
	DEPRECATED_SORTABLE: 'DERPECATED_SORTABLE',
}

const SEARCHABLE_ENUM = {
	SEARCHABLE: 'SEARCHABLE',
	NOT_SEARCHABLE: 'NON_SEARCHABLE',
	DEPRECATED_SEARCHABLE: 'DERPECATED_SEARCHABLE',
}

const NodeInterfaceFields = ['id', 'parent', 'children', 'internal']


const getOrCreateNodeInterface = schemaComposer => {
	const internalTC = schemaComposer.getOrCreateOTC('Internal', tc => {
		tc.addFields({
			content: 'String',
			contentDigest: 'String!',
			description: 'String',
			fieldOwners: ['String'],
			ignoreType: 'Boolean',
			mediaType: 'String',
			owner: 'String!',
			type: 'String!'
		})
		tc.getInputTypeComposer()
	})
	const nodeInterfaceTC = schemaComposer.getOrCreateIFTC('Node', tc => {
		tc.setDescription('Node Interface')
		tc.addFields({
			id: 'ID!',
			parent: {
				type: 'Node',
				resolve: (source, args, context, info) => {
					const { path } = context
					return context.nodeModel.getNodeById({ id: source.parent }, { path })
				},
				extensions: {
					searchable: SEARCHABLE_ENUM.SEARCHABLE,
					sortable: SORTABLE_ENUM.SORTABLE,
					needsResolve: true
				}
			},
			children: {
				type: '[Node!]!',
				resolve: (source, args, context, info) => {
					const { path } = context
					return context.nodeModel.getNodesByIds(
						{ ids: source.children },
						{ path }
					)
				},
				extensions: {
					searchable: SEARCHABLE_ENUM.SEARCHABLE,
					sortable: SORTABLE_ENUM.SORTABLE,
					needsResolve: true
				}
			},
			internal: internalTC.getTypeNonNull()
		})
		const nodeInputTC = tc.getInputTypeComposer()
		nodeInputTC.extendField('id', { type: 'String' })
	})
	return nodeInterfaceTC
}


const addNodeInterface = ({ schemaComposer, typeComposer }) => {
	const nodeInterfaceTC = getOrCreateNodeInterface(schemaComposer)
	typeComposer.addInterface(nodeInterfaceTC)
	addNodeInterfaceFields({ schemaComposer, typeComposer })
}


const addNodeInterfaceFields = ({ schemaComposer, typeComposer }) => {
	const nodeInterfaceTC = getOrCreateNodeInterface(schemaComposer)
	typeComposer.addFields(nodeInterfaceTC.getFields())
	nodeInterfaceTC.setResolveType(node => node.internal.type)
	schemaComposer.addSchemaMustHaveType(typeComposer)
}


const getNodeInterface = ({ schemaComposer }) => (
	getOrCreateNodeInterface(schemaComposer)
)


module.exports = {
	addNodeInterface,
	addNodeInterfaceFields,
	getNodeInterface,
	NodeInterfaceFields
}


