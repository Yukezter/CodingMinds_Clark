import { useLocation, Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { SocketProvider } from '../context/Socket'

const Private = () => {
  const location = useLocation()
  const auth = useAuth()

  const handleSignOut = () => {
    auth.signOut()
  }

  if (!auth.user) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return (
    <SocketProvider>
      <div className='min-h-screen max-w-5xl flex flex-col mx-auto'>
        <header className='flex justify-between items-center py-4 mb-5'>
          <nav>
            <Link to='/' className='text-lg font-bold'>Teams</Link>
          </nav>
          <button type='button' className='text-white bg-black rounded-lg py-1 px-5' onClick={handleSignOut}>Sign out</button>
        </header>
        <main className='grow flex flex-col pb-8'>
          <Outlet />
        </main>
      </div>
    </SocketProvider>
  )
}

export default Private