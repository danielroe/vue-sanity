import Vue from 'vue'
import CompositionApi, { ref, watch } from '@vue/composition-api'

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
          'SSR value': ['grapefruit', 'server loaded', 1000],
        },
      }
      // eslint-disable-next-line
      const { data, status } = useCache(key, async () => {})
      expect(data.value).toBe('grapefruit')
      expect(status.value).toBe('loading')
      return { data, status }
    })
    expect(data.value.status).toBe('client loaded')
  })

  test('allows server-only strategy', async () => {
    const data = await runInSetup(() => {
      const key = ref('server-strategy')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'server-strategy': ['server', 'server loaded', 1000],
        },
      }
      const { data, status } = useCache(key, async key => key, {
        strategy: 'server',
      })
      return { data, status }
    })
    expect(data.value.data).toBe('server')
    expect(data.value.status).toBe('server loaded')
  })

  test('reloads on client when appropriate under server-only strategy', async () => {
    const data = await runInSetup(() => {
      const key = ref('server-strategy-without-data')
      // eslint-disable-next-line
      const { data, status } = useCache(key, async key => key, {
        strategy: 'server',
      })
      return { data, status }
    })
    expect(data.value.data).toBe('server-strategy-without-data')
    expect(data.value.status).toBe('client loaded')
  })

  test('allows client-only strategy', async () => {
    const data = await runInSetup(() => {
      const key = ref('client-strategy')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'client-strategy': ['grapefruit', 'server loaded', 1000],
        },
      }
      // eslint-disable-next-line
      const { data, status } = useCache(key, async key => key, {
        strategy: 'client',
      })
      expect(data.value).toBe(null)
      expect(status.value).toBe('loading')
      return { data, status }
    })
    expect(data.value.status).toBe('client loaded')
    expect(data.value.data).toBe('client-strategy')
  })

  test('can trigger fetch manually', async () => {
    const key = ref('manualFetch')
    const data = await runInSetup(() => {
      const { data, fetch } = useCache(key, async newKey => newKey)
      return { data, fetch }
    })
    expect(data.value.data).toBe('manualFetch')

    key.value = 'change'
    expect(data.value.data).toBe(null)

    await data.value.fetch('triggered')
    key.value = 'triggered'
    expect(data.value.data).toBe('triggered')
  })

  test('sets error status correctly', async () => {
    const data = await runInSetup(() => {
      const key = ref('error')
      const { status, error } = useCache(key, async () => {
        throw new Error('failure')
      })
      return { status, error }
    })
    expect(data.value.status).toBe('error')
    expect(data.value.error).toBeInstanceOf(Error)
  })

  test('deduplicates requests', async () => {
    const key = ref('deduplicating')
    let number = 0
    const result = await runInSetup(() => {
      const { status, fetch } = useCache(
        key,
        async newKey => {
          number++
          return newKey
        },
        {
          deduplicate: true,
        }
      )
      useCache(
        key,
        async newKey => {
          number++
          return newKey
        },
        {
          deduplicate: true,
        }
      )
      return { status, fetch }
    })
    expect(number).toBe(1)
    expect(result.value.status).toBe('client loaded')
    await result.value.fetch()
    expect(number).toBe(2)
  })

  test('is reactive', async () => {
    const key = ref('reactive')
    const mockWatcher = jest.fn()

    await runInSetup(() => {
      const { data } = useCache(key, async newKey => newKey)
      watch(data, mockWatcher)
      expect(mockWatcher).toHaveBeenCalledTimes(1)
      key.value = 'new reactive'
      return { data }
    })

    expect(mockWatcher).toHaveBeenCalledTimes(2)
  })
})
