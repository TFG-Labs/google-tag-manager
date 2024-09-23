import { createOrGetAnalyticsData } from './analytics'

window.dataLayer = window.dataLayer || []

let isFirstPush = true

export default function push(rawEvent: Record<string, unknown>) {
  const {
    location: originalLocation,
    referrer: originalReferrer,
    origin,
  } = createOrGetAnalyticsData()

  const isBashPay = document?.cookie?.includes('bashpaybeta=true')

  let event = rawEvent

  if (isFirstPush || origin === 'fresh') {
    isFirstPush = false

    event = {
      ...rawEvent,
      ...(isBashPay ? { is_bash_pay: isBashPay } : {}),
      originalLocation,
      originalReferrer,
    }
  }

  window.dataLayer.push(event)
}
