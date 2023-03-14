import React from 'react'
import Ably from 'ably/promises'

const SocketContext = React.createContext({} as Ably.Realtime)

export const useSocket = () => React.useContext(SocketContext)

type SocketProviderProps = React.PropsWithChildren

const socket = new Ably.Realtime({
  authUrl: '/auth/socket',
  autoConnect: false
})

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    socket.connect()

    const listener: Ably.Types.connectionEventCallback = value => {
      console.log(value)
      setLoading(false)
    }

    socket.connection.on('connected', listener)

    return () => {
      console.log('Running socket desctructor...')

      socket.connection.off('connected', listener)
      setTimeout(() => {
        if (socket.connection.listeners.length === 0) {
          socket.close()
        }
      }, 2500)
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}