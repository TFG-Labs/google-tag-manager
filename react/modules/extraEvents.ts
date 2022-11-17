import push from './push'
import { PixelMessage } from '../typings/events'
import { toHash } from './analytics/utils'

export async function sendExtraEvents(e: PixelMessage) {

  switch (e.data.eventName) {
    case 'vtex:pageView': {
      push({
        event: 'pageView',
        location: e.data.pageUrl,
        page: e.data.pageUrl.replace(e.origin, ''),
        referrer: e.data.referrer,
        ...(e.data.pageTitle && {
          title: e.data.pageTitle,
        }),
      })

      return
    }

    case 'vtex:userData': {
      const { data } = e

      if (!data.isAuthenticated) {
        return
      }

      const emailHash = data.email ? await toHash(data.email) : undefined

      push({
        event: 'userData',
        userId: data.id,
        emailHash: emailHash 
      })

      break
    }

    default: {
      break
    }
  }
}
