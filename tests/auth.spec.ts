import { test as setup } from '@playwright/test'
import 'dotenv/config'
setup('authenticate', async ({ request }) => {
  const response = await request.post('/auth/login', {
    data: {
      username: process.env.USER,
      password: process.env.PASS
    }
  })
  const cookies = response.headersArray().filter(el => el.name === 'Set-Cookie')
  process.env.COOKIES = cookies[0].value
})
