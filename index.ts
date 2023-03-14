import * as path from 'path'
import express from 'express'
import * as bcrypt from 'bcrypt'
import * as middleware from './middleware'
import * as socket from './socket'
import * as sql from './sql'
import * as tokens from './helpers/tokens'
import parseCookies from './helpers/parseCookies'

const PORT = process.env.PORT || 8000
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body
  await sql.createUser(username, password)
  res.status(200).end()
})

app.post('/api/auth/login', async (req, res) => {
  const user = await sql.getUser(req.body.username)

  if (!user) {
    return res.status(400).send('Invalid email or password')
  }

  const passed = await bcrypt.compare(req.body.password, user.password)
  if (!passed) {
    return res.status(400).send('Invalid email or password')
  }

  const payload = { user: { id: user.id, username: user.username } }
  const token = tokens.create(payload)
  const refreshToken = tokens.create(payload, true)

  res.cookie('jwt', token, { sameSite: 'strict', httpOnly: true })
  res.cookie('jwt-refresh', refreshToken, {
    sameSite: 'strict',
    httpOnly: true,
    path: '/auth/refresh'
  })

  res.json({ user: payload.user, token, refreshToken })
})

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = parseCookies(req)['jwt-refresh']
  if (!refreshToken) {
    return res.status(401).send('Unauthorized')
  }

  try {
    const { user } = tokens.decode(refreshToken, true)
    const payload = { user: { id: user.id, username: user.username } }
    const token = tokens.create(payload)

    res.cookie('jwt', token, { sameSite: 'strict', httpOnly: true })
    res.json({ token })
  } catch (err: any) {
    console.log(err)

    if (err.name === 'TokenExpiredError') {
      res.clearCookie('jwt', { sameSite: 'strict', httpOnly: true })
      res.clearCookie('jwt-refresh', {
        sameSite: 'strict',
        httpOnly: true,
        path: '/api/auth/refresh'
      })

      return res.status(401).send('RefreshTokenExpired')
    }

    res.status(400).end()
  }
})

const api = express.Router().use(middleware.verifyUserToken)

api.get('/auth/socket', async (req, res) => {
  try {
    const tokenReq = await socket.createTokenReq(req.user.id)
    console.log('ABLY REQUEST TOKEN')
    console.log(tokenReq)
    res.json(tokenReq)
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal Server Error')
  }
})

api.post('/logout', (req, res) => {
  res.clearCookie('jwt', { sameSite: 'strict', httpOnly: true })
  res.clearCookie('jwt-refresh', {
    sameSite: 'strict',
    httpOnly: true,
    path: '/api/auth/refresh'
  })

  res.status(200).end()
})

api.get('/user', async (req, res) => {
  return res.json({ user: req.user })
})

api.get('/users', async (req, res) => {
  const users = (await sql.getUsers())
    .filter(user => user.id !== req.user.id)
    .map(user => ({ id: user.id, username: user.username }))

  return res.json(users)
})

// Get teams
api.get('/teams', async (req, res) => {
  const teams = await sql.getTeams(req.user.id)
  res.status(200).json(teams)
})

// Get team
api.get('/teams/:team_id', async (req, res) => {
  const { team_id } = req.params
  const team = await sql.getTeam(req.user.id, team_id)
  if (!team) {
    return res.status(404).end()
  }

  res.status(200).json(team)
})

// Create team
api.post('/teams/create', async (req, res) => {
  const team = await sql.createTeam(req.user.id)

  await Promise.all(team.members.map(member_id => {
    return socket.broadcast(`${member_id}:teams`)
  }))
  .catch(err => console.log(err))
  
  res.status(200).json(team)
})

// Delete team
api.post('/teams/:team_id/delete', async (req, res) => {
  const { team_id } = req.params
  const team = await sql.getTeam(req.user.id, team_id)

  if (!team) {
    return res.status(404).end()
  }

  if (!team.admin.includes(req.user.id)) {
    return res.status(401).end()
  }

  await sql.deleteTeam(team.id)

  await socket.broadcast(`teams:${team.id}`)

  res.status(200).end()
})

// Add team member(s)
api.post('/teams/:team_id/members/add', async (req, res) => {
  const user_ids = (Array.isArray(req.body.members) ? req.body.members : [req.body.members]) as string[]
  const { team_id } = req.params

  const team = await sql.getTeam(req.user.id, team_id)
  const memberIds = team.members.map(m => m.id)

  if (!team) {
    return res.status(404).end()
  }

  if (!team.admin.includes(req.user.id)) {
    return res.status(401).end()
  }

  await sql.addMembersToTeam(team.id, user_ids)
  
  await Promise.all([
    socket.broadcast(`teams:${team.id}`),
    ...user_ids
    .filter(userId => !memberIds.includes(userId))
    .map(userId => socket.broadcast(`${userId}:teams`))
  ]).catch(err => console.log(err))

  res.json(team)
})

// Remove team member
api.post('/teams/:team_id/members/:member_id/remove', async (req, res) => {
  const { team_id, member_id } = req.params

  if (member_id === req.user.id) {
    return res.status(400).end()
  }

  const team = await sql.getTeam(team_id, member_id)

  if (!team) {
    return res.status(404).end()
  }

  if (!team.admin.includes(req.user.id)) {
    return res.status(401).end()
  }

  await sql.removeMembersFromTeam(team.id, member_id)

  await Promise.all([
    socket.broadcast(`${member_id}:teams`),
    socket.broadcast(`teams:${team.id}`)
  ])
  .catch(err => console.log(err))

  res.json(team)
})

// Create team channel
api.post('/teams/:team_id/channels/create', async (req, res) => {
  const { team_id } = req.params
  const { channel_name } = req.body
  const team = await sql.addChannelToTeam(team_id, channel_name)

  if (!team) {
    return res.status(404).end()
  }

  if (!team.admin.includes(req.user.id)) {
    return res.status(401).end()
  }

  await socket.broadcast(`teams:${team.id}`)
    .catch(err => console.log(err))

  res.json(team)
})

api.post('/teams/:team_id/channels/:channel_id/delete', async (req, res) => {
  const { team_id, channel_id } = req.params
  const team = await sql.removeChannelFromTeam(team_id, channel_id)

  if (!team) {
    return res.status(404).end()
  }

  if (!team.admin.includes(req.user.id)) {
    return res.status(401).end()
  }

  await socket.broadcast(`teams:${team.id}`)
    .catch(err => console.log(err))

  res.json(team)
})

app.use('/api', api)

// const __dirname = path.resolve()
// app.use('(/*)?', express.static(path.join(__dirname, './client/build')))

app.listen(PORT, () => {  
  console.log(`Server started on port: ${PORT}`)
})

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, './client/build/public/index.html'))
// })