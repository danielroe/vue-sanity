import Vue from 'vue'
import CompositionApi, { ref } from '@vue/composition-api'

import { useCache } from '../src/cache'
import { runInSetup } from './helpers/mount'

Vue.use(CompositionApi)

jest.setTimeout(10000)

describe('cache', () => {
  test('initialises null when no default is given', async () => {
    const data = await runInSetup(() => {
      const key = ref('defaults')

      // eslint-disable-next-line
      const { data } = useCache(key, async () => {})
      return { data }
    })

    expect(data.value.data).toBe(null)
  })
  test('initialises with default when one is given', async () => {
    const data = await runInSetup(() => {
      const key = ref('defaults')

      // eslint-disable-next-line
      const { data } = useCache(key, async () => {}, {
        initialValue: 'orange',
      })
      return { data }
    })

    expect(data.value.data).toBe('orange')
  })

  test('calls fetcher immediately', async () => {
    const data = await runInSetup(() => {
      const key = ref('fetcherCalled')
      const { data } = useCache(key, async () => 'cherry')
      return { data }
    })

    expect(data.value.data).toBe('cherry')
  })

  test('sets initial value from SSR', async () => {
    const data = await runInSetup(() => {
      const key = ref('SSR value')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'SSR value': 'grapefruit',
        },
      }
      // eslint-disable-next-line
      const { data, status } = useCache(key, async () => {})
      expect(data.value).toBe('grapefruit')
      expect(status.value).toBe('server loaded')
      return { data, status }
    })
    expect(data.value.status).toBe('client loaded')
  })

  test('can trigger fetch manually', async () => {
    const key = ref('manualFetch')
    const data = await runInSetup(() => {
      const { data, triggerFetch } = useCache(key, async newKey => newKey)
      return { data, triggerFetch }
    })
    expect(data.value.data).toBe('manualFetch')

    key.value = 'change'
    expect(data.value.data).toBe(null)

    await data.value.triggerFetch('triggered')
    key.value = 'triggered'
    expect(data.value.data).toBe('triggered')
  })

  test('sets error status correctly', async () => {
    const data = await runInSetup(() => {
      const key = ref('error')
      const { status } = useCache(key, async () => {
        throw new Error('failure')
      })
      return { status }
    })
    expect(data.value.status).toBe('error')
  })
})
