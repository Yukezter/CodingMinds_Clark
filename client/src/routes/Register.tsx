import React from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../utils/HttpClient'

const Register = () => {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = new FormData(e.target as HTMLFormElement)
    const username = form.get('username')
    const password = form.get('password')
    
    client.api.post('/auth/register', { username, password })
      .then(() => {
        navigate('/login')
      })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <div className='flex justify-center'>
      <div className='max-w-sm shrink-0 w-full'>
        <form className='flex flex-col items-center w-full' onSubmit={handleSubmit}>
          <input
            type='text'
            name='username'
            className='w-full px-2 py-1 my-2 rounded-lg border-2 border-black box-border mr-2'
            placeholder='Username'
          />
          <input
            type='text'
            name='password'
            className='w-full px-2 py-1 my-2 rounded-lg border-2 border-black box-border mr-2 mb-5'
            placeholder='Password'
          />
          <button type='submit' className='w-full text-white bg-black rounded-lg py-1 px-5 border-2 border-black box-border'>
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register