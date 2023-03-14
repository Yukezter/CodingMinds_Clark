import { faker } from '@faker-js/faker'
import * as bcrypt from 'bcrypt'

export type User = Awaited<ReturnType<typeof createUser>>
export type Team = Awaited<ReturnType<typeof createTeam>>
export type PopulatedTeam = Omit<Team, 'members'> & {
  members: Pick<User, 'id' | 'username'>[]
}

const users: { [id: string]: User } = {}
const teams: { [id: string]: Team } = {}

export const getUsers = async () => {
  return Object.values(users)
}

export const getUser = async (username: string) => {
  const allUsers = await getUsers()
  return allUsers.find(user => user.username === username)
}

export const createUser = async (username: string, password: string) => {
  const user = {
    id: faker.helpers.unique(faker.datatype.uuid),
    username,
    password: await bcrypt.hash(password, 10)
  }

  users[user.id] = user

  return user
}

export const getTeams = async (user_id: string) => {
   return Object.values(teams)
    .filter(team => team.members.includes(user_id))
    .map(team => ({
      ...team,
      members: team.members.map(member => ({
        id: users[member].id,
        username: users[member].username, 
      }))
    }))
}

export const getTeam = async (user_id: string, team_id: string) => {
  const myTeams = await getTeams(user_id)
  const team = myTeams.find(team => team.id === team_id)
  return { ...team, members: [...team.members] }
}

export const createTeam = async (user_id: string) => {
  const team = {
    id: faker.helpers.unique(faker.datatype.uuid),
    name: faker.hacker.adjective() + faker.hacker.noun(),
    members: [user_id],
    admin: [user_id],
    channels: [{
      id: faker.helpers.unique(faker.datatype.uuid),
      name: 'general',
    }]
  }

  teams[team.id] = team
  return team
}

export const deleteTeam = async (team_id: string) => {
  delete teams[team_id]
}

export const addMembersToTeam = async (id: string, members: string | string[]) => {
  const team = teams[id]

  if (!team) {
    return null
  }

  let _members = Array.isArray(members) ? members : [members]
  _members = _members.filter(m => !!users[m] && !team.members.includes(m))
  team.members = [...team.members, ..._members]

  return team
}

export const removeMembersFromTeam = async (id: string, members: string | string[]) => {
  const team = teams[id]

  if (!team) {
    return null
  }

  const _members = Array.isArray(members) ? members : [members]
  team.members = team.members.filter(m => !_members.includes(m))

  return team
}

export const addChannelToTeam = async (team_id: string, channel_name: string) => {
  const team = teams[team_id]

  if (!team) {
    return null
  }

  const channel = {
    id: faker.helpers.unique(faker.datatype.uuid),
    name: channel_name,
  }

  team.channels.push(channel)

  return team
}

export const removeChannelFromTeam = async (team_id: string, channel_id: string) => {
  const team = teams[team_id]

  if (!team) {
    return null
  }

  team.channels.filter(channel => channel.id !== channel_id)

  return team
}
