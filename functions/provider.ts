



import { URL } from 'url'
import { APIGatewayEvent, ProxyResult } from 'aws-lambda'
import axios, { AxiosResponse } from 'axios'



export const handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
	const identity: string = `client_id=${process.env.GITHUB_CLIENT_ID}`
	const secret: string = `client_secret=${process.env.GITHUB_CLIENT_SECRET}`
	const params: string = `${identity}&${secret}&code=${event.queryStringParameters?.code}`
	const url: string = `https://github.com/login/oauth/access_token?${params}`
	const access: AxiosResponse = await axios.post(url)
	const referer: string = new URL(event.headers.referer || '').pathname
	const token: string = decodeURIComponent(access.data)
	return {
		statusCode: 302,
		body: '',
		headers: {
			// Trigger redirection with the provided access token
			Location: `${referer}#${token}`
		}
	}
}


