import { Handler } from 'express'
import * as jwt from 'jsonwebtoken'
import parseCookies from './helpers/parseCookies'

export const verifyUserToken: Handler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] ?? parseCookies(req).jwt
  if (!token) {
    return res.status(401).send("Unauthorized")
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload
    req.user = decoded.user
    
    next()
  } catch (err) {
    // console.log(req.path)
    // console.log(JSON.stringify(err, null, 2))

    if (err.name === 'TokenExpiredError') {
      return res.status(401).send("TokenExpired")
    }

    res.status(400).end()
  }
}