declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string
      JWT_REFRESH_SECRET: string
      ABLY_API_KEY: string
    }
  }

  namespace Express {
    interface Request {
      user: {
        id: string
        username: string
      }
    }
  }

  namespace jwt {
    interface JwtPayload {
      user: {
        id: string
        username: string
      }
    }
  }
}

export {}