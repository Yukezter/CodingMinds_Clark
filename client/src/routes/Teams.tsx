import React from 'react'
import { Link } from 'react-router-dom' 
import { Team } from '../../../sql'
import client from '../utils/HttpClient'
import { useAuth } from '../context/Auth'
import useChannel from '../hooks/useChannel'

const CreateTeam = () => {
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = new FormData(e.target as HTMLFormElement)
    const name = form.get('name')

    if (!loading) {
      setLoading(true)
      client.api.post('/teams/create', { name })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return (
    <div className='flex mb-4'>
      <form className='flex items-center' onSubmit={handleSubmit}>
        {/* <input
          type='text'
          className='w-100 px-2 py-1 my-2 rounded-lg border-2 border-black box-border mr-2'
          placeholder='Team Name'
        /> */}
        <button type='submit' className='text-white bg-black rounded-lg py-1 px-5 border-2 border-black box-border'>
          {loading ? 'Loading...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}

const getTeams = async () => {
  const { data } = await client.api.get<Team[]>('/teams')
  return data
}

export const Teams = () => {
  const auth = useAuth()
  const [teams, setTeams] = React.useState<Team[]>()

  React.useEffect(() => {
    getTeams()
      .then(data => setTeams(data))
      .catch(err => console.log(err))
  }, [])

  useChannel({
    channelName: `${auth.user?.id}:teams`,
    reauthorize: true,
  }, () => {
    getTeams()
      .then(data => setTeams(data))
      .catch(err => console.log(err))
  })

  if (!teams) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <CreateTeam />
      <div>
        <div>
          <h1 className='text-3xl font-bold mb-5'>My Teams</h1>
          <ul className='grid grid-cols-4 gap-4'>
            {teams.map(team => (
              <li key={team.id} className='text-center border-2 border-black rounded-lg'>
                <Link to={`/teams/${team.id}/`} className='block h-100 p-3'>
                  {team.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Teams
