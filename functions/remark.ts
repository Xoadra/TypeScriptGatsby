



import { Handler, APIGatewayEvent, Context, Callback, ProxyResult } from 'aws-lambda'

import parseMarkdown from './helpers/scribe/parse-markdown'



// Example function signature in TypeScript using all parameters
/* export const handler: Handler = async (
	event: APIGatewayEvent, context: Context, callback: Callback
): Promise<ProxyResult> => { */

export const handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
	const graphql: object = JSON.parse(event.body || '')
	const markdown: object = await parseMarkdown(graphql)
	return {
		statusCode: 200,
		body: JSON.stringify(markdown)
	}
}


