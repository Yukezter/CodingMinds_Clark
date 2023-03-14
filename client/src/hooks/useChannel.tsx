import React from 'react'
import Ably, { Types } from 'ably'
import { useSocket } from '../context/Socket'

type ChannelNameAndOptions = { channelName: string; reauthorize: boolean; options?: Types.ChannelOptions; }
type ChannelParameters =  string | ChannelNameAndOptions;
type Rest = Parameters<Ably.Types.RealtimeChannelPromise['subscribe']>

const useChannel = (channelNameOrOptions: ChannelParameters, ...args: Rest) => {
  const socket = useSocket()

  const channelName = typeof channelNameOrOptions === 'string'
    ? channelNameOrOptions
    : channelNameOrOptions.channelName

  const channelOptions = typeof channelNameOrOptions === 'string'
    ? { reauthorize: false, options: undefined }
    : channelNameOrOptions

  const channel = socket.channels.get(channelName, channelOptions.options)

  const onMount = async () => {
    if (channelOptions.reauthorize) {
      const cb = args[args.length - 1]
      args[args.length - 1] = message => {
        socket.auth.authorize().then(() => {
          console.log('authorized callback')
          cb(message)
        })
      }
    }

    
    await channel.subscribe.apply(channel, args)
  }

  const onUnmount = async () => {
    channel.unsubscribe.apply(channel, args as any)

    setTimeout(async () => {
      if (channel.listeners.length === 0) {
        await channel.detach()
      }
    }, 2500)
  }

  React.useEffect(() => {
    onMount()
    return () => {
      onUnmount()
    }
  // eslint-disable-next-line
  }, [channelName])
  
  return [channel, socket] as [Ably.Types.RealtimeChannelPromise, Ably.Realtime]
}

export default useChannel

// type Callback = Ably.Types.messageCallback<Ably.Types.Message>
// type Args = [string, Callback] | [Callback]

// const reauthorize = async <T, U extends unknown[]>(
//   fn: (...args: U) => Promise<T>,
//   ...args: U
// ): Promise<T> => {
//   return new Promise((resolve, reject) => {
//     fn.apply(channel, args).then(resolve).catch(err => {
//       if (err.code === 40160) {
//         console.log('Reauthorizing socket connection...')
//         return socket.auth.authorize()
//         .then(() => {
//           fn.apply(channel, args).then(resolve).catch(reject)
//         })
//         .catch(() => reject(err))
//       } else {
//         reject(err)
//       }
//     })
//   })
// }