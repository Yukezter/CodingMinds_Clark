import React from 'react'
import client from '../utils/HttpClient'

type User = {
  id: string
  username: string
}

type AuthState = {
  isLoading: boolean
  error: Error | null
  user: User | null
}

type Auth = AuthState & {
  signIn: (user: User) => void
  signOut: () => void
}

const AuthContext = React.createContext<Auth>({} as Auth)

export const useAuth = () => React.useContext(AuthContext)

type AuthProviderProps = React.PropsWithChildren

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = React.useReducer(
    (oldState: AuthState, newState: AuthState) => newState,
    {
      isLoading: true,
      error: null,
      user: null,
    }
  )

  const resetState = React.useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      user: null,
    })
  }, [])

  const signIn = React.useCallback((user: User) => {
    setState({
      isLoading: false,
      error: null,
      user,
    })
  }, [])

  const signOut = React.useCallback(() => {
    resetState()
    client.api.post('/logout').catch(err => console.log(err))
  }, [resetState])

  React.useEffect(() => {
    client.api.get('/user')
      .then(res => signIn(res.data.user))
      .catch(() => resetState())
  }, [signIn, resetState])

  React.useEffect(() => {
    const listener = () => resetState()
    client.addListener('token-expired', listener)
    return () => {
      client.removeListener('token-expired', listener)
    }
  }, [resetState])

  if (state.isLoading) {
    return <div>Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}