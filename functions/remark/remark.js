



const parseMarkdown = require('./helpers/scribe/parse-markdown')



exports.handler = (event, context, callback) => {
	const graphql = JSON.parse(event.body)
	parseMarkdown(graphql).then(markdown => {
		callback(null, {
			statusCode: 200,
			body: JSON.stringify(markdown)
		})
	})
}


