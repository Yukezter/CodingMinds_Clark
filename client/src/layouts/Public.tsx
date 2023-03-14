import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'

const Public = () => {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to='/' replace />
  }

  return (
    <div className='max-w-5xl flex flex-col mx-auto'>
      <header className='py-4 mb-5'>
        <nav className='flex justify-between items-center'>
          <Link to='/' className='text-lg font-bold'>Teams</Link>
          <span>
            <Link to='/register' className='text-md font-bold mr-2'>Sign up</Link>
            <Link to='/login' className='text-md font-bold'>Login
            </Link>
          </span>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export default Public