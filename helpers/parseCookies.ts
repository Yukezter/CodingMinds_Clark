import { Request } from 'express'

const parseCookies = (req?: Request) => {
  const cookies: { [k: string]: string } = {}

  req.headers.cookie?.split(';').forEach(cookie => {
    if (cookie) {
      const pair = cookie.split(/=(.*)/s)
      cookies[pair[0].trim()] = pair[1]
    }
  })

  return cookies
}

export default parseCookies