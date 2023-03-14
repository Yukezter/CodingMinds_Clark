import * as jwt from 'jsonwebtoken'

export const create = (payload: string | object | Buffer, refresh = false) => {
  const secret = refresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET
  const expiresIn = refresh ? '1d' : '1h'
  return jwt.sign(payload, secret, { expiresIn })
}

export const decode = (token: string, refresh = false) => {
  const secret = refresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET
  return jwt.verify(token, secret) as jwt.JwtPayload
}
