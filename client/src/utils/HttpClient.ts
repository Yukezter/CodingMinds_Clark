import { EventEmitter } from 'events'
import axios from 'axios'

class HttpClient extends EventEmitter {
  api = axios.create()

  constructor() {
    super()

    this.api.interceptors.response.use(null, async err => {
      if (err.response?.status !== 401 || err.response?.data !== 'TokenExpired') {
        return Promise.reject(err)
      }

      try {
        await this.api.post('/auth/refresh')
        return this.api(err.response?.config)
      } catch (e: any) {
        this.emit('token-expired', e)
        return Promise.reject(e)
      }
    })
  }
}

const client = new HttpClient()
export default client
