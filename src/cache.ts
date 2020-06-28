import Vue from 'vue'
import {
  Ref,
  reactive,
  watch,
  computed,
  onServerPrefetch,
  getCurrentInstance,
} from '@vue/composition-api'

/**
 * Cached data, status of fetch, timestamp of last fetch, error
 */
type CacheEntry<T> = [T, FetchStatus, number, any, Promise<T>]

const cache = reactive<Record<string, CacheEntry<any>>>({})

export function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance
}

export function getServerInstance() {
  const instance = getCurrentInstance()

  if (instance?.$isServer) return instance
  return false
}

export type FetchStatus =
  | 'initialised'
  | 'loading'
  | 'server loaded'
  | 'client loaded'
  | 'error'

interface SetCacheOptions<T, K> {
  key: string
  value?: T | K
  status?: FetchStatus
  error?: any
  promise?: Promise<T | K>
  time?: number
}

export interface CacheOptions<K> {
  initialValue?: K
  /**
   * Whether to disable SSR fetching. Defaults to false. Now replaced with strategy: 'client'
   * @deprecated
   */
  clientOnly?: boolean
  /**
   * Strategy for fetching. Defaults to 'both'.
   * 'server' will not refetch if the cache has been populated on SSR.
   * 'client' will disable SSR fetching.
   * 'both' will fetch on server and refetch when page is loaded.
   */
  strategy?: 'server' | 'client' | 'both'
  /**
   * Whether to de-duplicate identical fetches. If set to `true`, additional fetches will not run unless made after
   * the previous request errors or succeeds. If set to a number, additional fetches will run, but only after this
   * many milliseconds after the previous fetch began.
   */
  deduplicate?: boolean | number
}

export function useCache<T, K = null>(
  key: Ref<string>,
  fetcher: (key: string) => Promise<T>,
  options: CacheOptions<K> = {}
) {
  const {
    initialValue = null,
    deduplicate = false,
    strategy = 'both',
    clientOnly = false,
  } = options

  const enableSSR = !clientOnly && strategy !== 'client'

  function initialiseCache({
    key,
    value,
    error = null,
    status = 'initialised',
    time = new Date().getTime(),
  }: SetCacheOptions<T, K>) {
    Vue.set(cache, key, [value, status, time, error])
  }

  const serverInstance = getServerInstance()
  if (enableSSR && !serverInstance) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState && prefetchState[key.value]) {
      const [value, status, time, error] = prefetchState[
        key.value
      ] as CacheEntry<T>

      initialiseCache({
        key: key.value,
        value,
        status,
        time,
        error,
      })
    }
  }

  function verifyKey(key: string) {
    const emptyCache = !(key in cache)
    if (emptyCache) initialiseCache({ key, value: initialValue as K })
    return emptyCache || cache[key][1] === 'initialised'
  }

  function setCache({
    key,
    value = cache[key]?.[0] || initialValue,
    status = cache[key]?.[1],
    error = null,
    promise = cache[key]?.[4],
  }: SetCacheOptions<T, K>) {
    if (!(key in cache)) initialiseCache({ key, value, status })

    Vue.set(cache[key], 0, value)
    Vue.set(cache[key], 1, status)
    Vue.set(cache[key], 2, new Date().getTime())
    Vue.set(cache[key], 3, error)
    Vue.set(cache[key], 4, promise)
  }

  function fetch(query = key.value, force?: boolean) {
    if (
      !force &&
      deduplicate &&
      cache[query]?.[1] === 'loading' &&
      (deduplicate === true ||
        deduplicate < new Date().getTime() - cache[query]?.[2])
    )
      return Promise.resolve(cache[query][4] || initialValue) as Promise<T>

    const promise = fetcher(query)
    setCache({ key: query, status: 'loading', promise })

    promise
      .then(value =>
        setCache({
          key: query,
          value,
          status: serverInstance ? 'server loaded' : 'client loaded',
        })
      )
      .catch(error => setCache({ key: query, status: 'error', error }))
    return promise
  }

  if (enableSSR && serverInstance) {
    const ctx = serverInstance.$ssrContext
    if (ctx) {
      if (ctx.nuxt && !ctx.nuxt.vsanity) {
        ctx.nuxt.vsanity = {}
      } else if (!ctx.vsanity) {
        ctx.vsanity = {}
      }
    }

    onServerPrefetch(async () => {
      try {
        await fetch(key.value, verifyKey(key.value))
        // eslint-disable-next-line
      } catch {}
      if (ctx && !['loading', 'initialised'].includes(cache[key.value]?.[1])) {
        if (ctx.nuxt) {
          ctx.nuxt.vsanity[key.value] = cache[key.value]
        } else {
          ctx.vsanity[key.value] = cache[key.value]
        }
      }
    })
  }

  const data = computed(() => {
    verifyKey(key.value)

    return (cache[key.value] && cache[key.value][0]) as T | K
  })

  const status = computed(() => {
    verifyKey(key.value)

    return cache[key.value][1]
  })

  const error = computed(() => {
    verifyKey(key.value)

    return cache[key.value][3]
  })

  watch(
    key,
    key => {
      if (strategy === 'server' && status.value === 'server loaded') return

      fetch(key, verifyKey(key))
    },
    { immediate: true }
  )

  return {
    setCache,
    triggerFetch: fetch,
    fetch,
    data,
    status,
    error,
  }
}
