



import { APIGatewayEvent, Context, Callback } from 'aws-lambda'



export const handler = (event: APIGatewayEvent, context: Context, callback: Callback): void => {
	const scope: string = ['public_repo', 'read:org', 'read:user'].join(',')
	const params: string = `client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scope}`
	callback(null, {
		statusCode: 200,
		body: params
	})
}



