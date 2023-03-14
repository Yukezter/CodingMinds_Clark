import Ably from 'ably/promises'
import * as sql from './sql'

const rest = new Ably.Rest(process.env.ABLY_API_KEY)

const createCapability = async (clientId: string) => {
  const capability: Ably.Types.TokenParams['capability'] = {
    [`${clientId}:*`]: ['subscribe'],
  }

  const teams = await sql.getTeams(clientId)
  teams.forEach(team => {
    capability[`teams:${team.id}`] = ['subscribe']
    capability[`teams:${team.id}:*`] = [
      'subscribe',
      'publish',
      'presence',
      'history'
    ]
  })

  return capability
}

export const createTokenReq = async (clientId: string) => {
  const capability = await createCapability(clientId)
  return rest.auth.createTokenRequest({ clientId, capability })
}

export const broadcast = async (name: string, message: any = {}) => {
  const channel = rest.channels.get(name)
  return channel.publish(message)
}