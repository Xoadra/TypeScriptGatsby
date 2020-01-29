



import { URL } from 'url'
import serverless, { Handler } from 'serverless-http'
import express, { Express, Router, Request, Response } from 'express'
import axios, { AxiosResponse } from 'axios'
import bodyParser from 'body-parser'



const app: Express = express()
const router: Router = express.Router()


app.use(bodyParser.json())


router.get('/express', (request: Request, response: Response): void => {
	console.log('\n\nEXPRESS!!!\n\n')
	response.send('Express!')
})

router.get('/', async (request: Request, response: Response): Promise<void> => {
	const identity: string = `client_id=${process.env.GITHUB_CLIENT_ID}`
	const secret: string = `client_secret=${process.env.GITHUB_CLIENT_SECRET}`
	const params: string = `${identity}&${secret}&code=${request.query.code}`
	const url: string = `https://github.com/login/oauth/access_token?${params}`
	const access: AxiosResponse = await axios.post(url)
	const referer: string = new URL(request.headers.referer || '').pathname
	const token: string = decodeURIComponent(access.data)
	response.redirect(`${referer}#${token}`)
})


app.use('/.netlify/functions/provider', router)


export const handler: Handler = serverless(app)



