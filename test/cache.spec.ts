import { ref, watch } from 'vue'

import { useCache } from '../src'
import { runInSetup } from './helpers/mount'

jest.setTimeout(10000)

describe('cache', () => {
  test('initialises null when no default is given', async () => {
    const data = await runInSetup(() => {
      const key = ref('defaults')

      // eslint-disable-next-line
      const { data } = useCache(key, async () => {})
      return { data }
    })

    expect(data.data).toBe(null)
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

    expect(data.data).toBe('orange')
  })

  test('calls fetcher immediately', async () => {
    const data = await runInSetup(() => {
      const key = ref('fetcherCalled')
      const { data } = useCache(key, async () => 'cherry')
      return { data }
    })

    expect(data.data).toBe('cherry')
  })

  test('can trigger fetch manually', async () => {
    const key = ref('manualFetch')
    const data = await runInSetup(() => {
      const { data, fetch } = useCache(key, async newKey => newKey)
      return { data, fetch }
    })
    expect(data.data).toBe('manualFetch')

    key.value = 'change'
    expect(data.data).toBe(null)

    await data.fetch('triggered')
    key.value = 'triggered'
    expect(data.data).toBe('triggered')
  })

  test('sets error status correctly', async () => {
    const data = await runInSetup(() => {
      const key = ref('error')
      const { status, error } = useCache(key, async () => {
        throw new Error('failure')
      })
      return { status, error }
    })
    expect(data.status).toBe('error')
    expect(data.error).toBeInstanceOf(Error)
  })

  test('uses cache and deduplicates requests', async () => {
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
    expect(result.status).toBe('client loaded')
    await result.fetch()
    expect(number).toBe(1)
  })

  test('does not use cache if enough time passes', async () => {
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
          deduplicate: 10,
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
    expect(result.status).toBe('client loaded')
    await new Promise(resolve =>
      setTimeout(async () => {
        await result.fetch()
        resolve()
      }, 20)
    )
    expect(number).toBe(1)
  })

  test('is reactive', async () => {
    const key = ref('reactive')
    const mockWatcher = jest.fn()

    await runInSetup(() => {
      const { data } = useCache(key, async newKey => newKey)
      watch(data, mockWatcher, { immediate: true })
      expect(mockWatcher).toHaveBeenCalledTimes(1)
      key.value = 'new reactive'
      return { data }
    })

    expect(mockWatcher).toHaveBeenCalledTimes(2)
  })
})
