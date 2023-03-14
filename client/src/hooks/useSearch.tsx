import React from 'react'
import { User } from "../../../sql"
import client from '../utils/HttpClient'

type Users = Pick<User, 'id' | 'username'>[]

// type UseSearch = {

// }

const useSearch = () => {
  const [users, setUsers] = React.useState<Users>([])
  const [results, setResults] = React.useState<Users>([])
  // const [queryValue, setQueryValue] = React.useState('')

  React.useEffect(() => {
    client.api.get<Users>('/users')
    .then(({ data }) => {
      setUsers(data)
    })
    .catch(err => {
      console.log(err)
    })
  }, [])
  
  const search = (value: string) => {
    // setQueryValue(newQueryValue)
    if (value) {
      setResults(users.filter(user => user.username.includes(value)))
    } else {
      setResults([])
    }
  }

  return {
    results,
    search
  }
}

export default useSearch