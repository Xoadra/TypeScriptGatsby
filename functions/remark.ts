



import { Handler, APIGatewayEvent, Context, Callback } from 'aws-lambda'

import parseMarkdown from './helpers/scribe/parse-markdown'



interface Response {
	statusCode: number
	body: string
}


// Example function signature in TypeScript using all parameters
/* export const handler: Handler = async (
	event: APIGatewayEvent, context: Context, callback: Callback
): Promise<Response> => { */

export const handler = async (event: APIGatewayEvent): Promise<Response> => {
	const graphql: object = JSON.parse(event.body || '')
	const markdown: object = await parseMarkdown(graphql)
	return {
		statusCode: 200,
		body: JSON.stringify(markdown)
	}
}


