/**
 * @jest-environment happy-dom
 */
import { ref, watch } from '@vue/composition-api'
import { describe, expect, vi } from 'vitest'
import { useCache } from '../src'
import { runInSetup } from './helpers/mount'

describe('cache', () => {
  it('initialises null when no default is given', async () => {
    const data = await runInSetup(() => {
      const key = ref('defaults')

      const { data } = useCache(key, async () => {})
      return { data }
    })

    expect(data.value.data).toBe(null)
  })
  it('initialises with default when one is given', async () => {
    const data = await runInSetup(() => {
      const key = ref('defaults')

      const { data } = useCache(key, async () => {}, {
        initialValue: 'orange',
      })
      return { data }
    })

    expect(data.value.data).toBe('orange')
  })

  it('calls fetcher immediately', async () => {
    const data = await runInSetup(() => {
      const key = ref('fetcherCalled')
      const { data } = useCache(key, async () => 'cherry')
      return { data }
    })

    expect(data.value.data).toBe('cherry')
  })

  it('sets initial value from SSR', async () => {
    const data = await runInSetup(() => {
      const key = ref('SSR value')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'SSR value': ['grapefruit', 'server loaded', 1000],
        },
      }

      const { data, status } = useCache(key, async () => {})
      expect(data.value).toBe('grapefruit')
      expect(status.value).toBe('loading')
      return { data, status }
    })
    expect(data.value.status).toBe('client loaded')
  })

  it('allows server-only strategy', async () => {
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

  it('reloads on client when appropriate under server-only strategy', async () => {
    const data = await runInSetup(() => {
      const key = ref('server-strategy-without-data')

      const { data, status } = useCache(key, async key => key, {
        strategy: 'server',
      })
      return { data, status }
    })
    expect(data.value.data).toBe('server-strategy-without-data')
    expect(data.value.status).toBe('client loaded')
  })

  it('allows client-only strategy', async () => {
    const data = await runInSetup(() => {
      const key = ref('client-strategy')
      ;(window as any).__NUXT__ = {
        vsanity: {
          'client-strategy': ['grapefruit', 'server loaded', 1000],
        },
      }

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

  it('can trigger fetch manually', async () => {
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

  it('sets error status correctly', async () => {
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

  it('uses cache and deduplicates requests', async () => {
    const key = ref('deduplicating')
    let number = 0
    const result = await runInSetup(() => {
      const { status, fetch } = useCache(
        key,
        async (newKey) => {
          number++
          return newKey
        },
        {
          deduplicate: true,
        },
      )
      useCache(
        key,
        async (newKey) => {
          number++
          return newKey
        },
        {
          deduplicate: true,
        },
      )
      return { status, fetch }
    })
    expect(number).toBe(1)
    expect(result.value.status).toBe('client loaded')
    await result.value.fetch()
    expect(number).toBe(1)
  })

  it('does not use cache if enough time passes', async () => {
    const key = ref('deduplicating')
    let number = 0
    const result = await runInSetup(() => {
      const { status, fetch } = useCache(
        key,
        async (newKey) => {
          number++
          return newKey
        },
        {
          deduplicate: 10,
        },
      )
      useCache(
        key,
        async (newKey) => {
          number++
          return newKey
        },
        {
          deduplicate: true,
        },
      )
      return { status, fetch }
    })
    expect(number).toBe(1)
    expect(result.value.status).toBe('client loaded')
    await new Promise(resolve =>
      setTimeout(async () => {
        await result.value.fetch()
        resolve()
      }, 20),
    )
    expect(number).toBe(1)
  })

  it('is reactive', async () => {
    const key = ref('reactive')
    const mockWatcher = vi.fn()

    await runInSetup(() => {
      const { data } = useCache(key, async newKey => newKey)
      watch(data, mockWatcher, { immediate: true })
      expect(mockWatcher).toHaveBeenCalledTimes(1)
      key.value = 'new reactive'
      return { data }
    })

    expect(mockWatcher).toHaveBeenCalledTimes(2)
  })
}, 10000)
