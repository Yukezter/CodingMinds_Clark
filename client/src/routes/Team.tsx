import React from 'react'
import Ably from 'ably'
import { useParams } from 'react-router-dom'
import client from '../utils/HttpClient'
import { PopulatedTeam } from '../../../sql'
import { useAuth } from '../context/Auth'
import useSearch from '../hooks/useSearch'
import useChannel from '../hooks/useChannel'

type ChannelProps = {
  team: PopulatedTeam
  channel: PopulatedTeam['channels'][number]
}

// const messages = Array.from(Array(30)).map((_, index) => ({
//   id: index,
//   clientId: 'dcb8a20c-3dde-4995-8e49-b7acf5510c62',
//   timestamp: Date.now(),
//   data: {
//     from: 'Me',
//     message: 'wow'
//   }
// }))

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const AMPM = hours >= 12 ? 'PM' : 'AM'
  return `${hours > 12 ? hours - 12 : hours}:${minutes}${AMPM}`
}

export const Channel = (props: ChannelProps) => {
  const auth = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [messages, setMessages] = React.useState<Ably.Types.Message[]>([])

  const [channel] = useChannel(
    `teams:${props.team.id}:${props.channel.id}`,
    message => setMessages(prevState => [...prevState, message])
  )

  React.useEffect(() => {
    let mounted = true

    setLoading(true)
    channel.history({ direction: 'forwards' })
      .then(data => {
        if (mounted) {
          setLoading(false)
          setMessages(data.items)
        }
      })
      .catch(err => {
        console.log(err)
      })

    return () => {
      mounted = false
    }
  }, [channel])

  const messagesDivRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const div = messagesDivRef.current
    if (div) {
      div.scrollTop = div?.scrollHeight
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const target = e.target as HTMLFormElement
    const form = new FormData(target)
    const message = form.get('message')

    if (message) {
      channel.publish('message', { message, from: auth.user?.username })
        .then(() => target.reset())
        .catch(err => console.log(err))
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div ref={messagesDivRef} className='grow flex flex-col overflow-y-auto p-3'>
        <ul className='mt-auto'>
          {messages.map(msg => {
            const align = auth.user?.id === msg.clientId ? 'text-right' : 'text-left'
            return (
              <li
                key={msg.id}
                className={`w-120 ${align}`}
              >
                  <div>{msg.data.from}: {msg.data.message}</div>
                  <span className='text-xs'>{formatTime(msg.timestamp)}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <form className='flex p-3' onSubmit={handleSubmit}>
        <input className='grow px-2 py-1 rounded-lg border-2 border-black box-border mr-2' type='text' name='message' />
        <button className='text-white bg-black rounded-lg py-1 px-3' type='submit'>Send</button>
      </form>
    </>
  )
}

type InviteUsersProps = {
  team: PopulatedTeam
}

const InviteUsers = ({ team }: InviteUsersProps) => {
  const search = useSearch()
  const [isOpen, setIsOpen] = React.useState(false)

  const open = () => {
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  const inviteUser = (userId: string) => () => {
    client.api.post(`/teams/${team.id}/members/add`, { members: userId })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <>
      <button type='button' className='text-lg' onClick={open}>+</button>
      <div className={`${isOpen ? 'block' : 'hidden'} fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full`} id="my-modal">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className='flex justify-between items-center mb-5'>
            <div>Invite Users</div>
            <button type='button' className='text-lg' onClick={close}>x</button>
          </div>
          <input type='text' className='w-full px-2 py-1 rounded-lg border-2 border-black box-border mr-2' onChange={e => search.search(e.target.value)} />
          <ul className='my-1'>
            {search.results.map(user => (
              <li key={user.id} className='flex justify-between items-center p-1 my-1'>
                <span>{user.username}</span>
                <button type='button' className='text-white bg-black rounded-lg py-1 px-3' onClick={inviteUser(user.id)}>Invite</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

const getTeam = async (team_id?: string) => {
  const { data } = await client.api.get(`/teams/${team_id}`)
  return data
}

export const Team = () => {
  const params = useParams()
  const [team, setTeam] = React.useState<PopulatedTeam>()
  const [channelIndex, setChannelIndex] = React.useState(0)

  React.useEffect(() => {
    getTeam(params.team_id)
      .then(data => setTeam(data))
      .catch(err => console.log(err))
  }, [params.team_id])
  
  useChannel(`teams:${params.team_id}`, () => {
    getTeam(params.team_id)
      .then(data => setTeam(data))
      .catch(err => console.log(err))
  })

  const selectChannel = (index: number) => () => {
    setChannelIndex(index)
  }

  if (!team) {
    return <div>Loading...</div>
  }

  return (
    <>
      <h1 className='text-3xl font-bold mb-5'>{team.name}</h1>
      <div className='grow grid grid-cols-4 gap-4' style={{ height: 400 }}>
        <div className='border-2 border-black rounded-lg p-3'>
          <div className='flex justify-between items-center mb-2'>
            <div>Channels</div>
            <button type='button' className='text-lg'>+</button>
          </div>
          <ul>
            {team.channels.map((channel, index) => (
              <li key={channel.id} className='block bg-zinc-300 rounded-lg'>
                <button
                  type='button'
                  className='block w-full text-left px-2 py-1'
                  onClick={selectChannel(index)}
                >
                  #{channel.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className='col-span-2 border-2 border-black rounded-lg flex flex-col overflow-hidden'>
          {!team.channels[channelIndex] ? (
            <div>None</div>
          ) : (
            <Channel
              team={team}  
              channel={team.channels[channelIndex]}
            />
          )}
        </div>
        <div className='border-2 border-black rounded-lg p-3'>
            <div className='flex justify-between items-center mb-2'>
              <div>Members</div>
              <InviteUsers team={team} />
            </div>
            <ul>
              {team.members.map(member => (
                <li key={member.id}>{member.username}</li>
              ))}
            </ul>
          </div>
      </div>
    </>
  )
}

export default Team