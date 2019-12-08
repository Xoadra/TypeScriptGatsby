



import CMS from 'netlify-cms-app'



CMS.init({
	config: {
		backend: {
			name: 'git-gateway'
		},
		load_config_file: false,
		publish_mode: 'editorial_workflow',
		media_folder: 'static/images',
		public_folder: 'images',
		collections: [
			{
				label: 'Repos',
				name: 'repos',
				folder: 'content/repos',
				create: true,
				fields: [
					{ label: 'Title', name: 'title', widget: 'string' },
					{ label: 'Body', name: 'body', widget: 'markdown' }
				]
			}
		]
	}
})


