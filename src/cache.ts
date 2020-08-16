import Vue from 'vue'
import {
  computed,
  getCurrentInstance,
  isRef,
  onServerPrefetch,
  reactive,
  Ref,
  watch,
} from '@vue/composition-api'

/**
 * Cached data, status of fetch, timestamp of last fetch, error
 */
type CacheEntry<T> = [T, FetchStatus, number, any, Promise<T>]

const cache = reactive<Record<string, CacheEntry<any>>>({})

const unwrap = <T>(val: Ref<T> | T) => (isRef(val) ? val.value : val)

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
  promise?: Promise<T> | null
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
  key: string | Ref<string>,
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
    if (prefetchState && prefetchState[unwrap(key)]) {
      const [value, status, time, error] = prefetchState[
        unwrap(key)
      ] as CacheEntry<T>

      initialiseCache({
        key: unwrap(key),
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

  function fetch(query = unwrap(key), force?: boolean) {
    if (
      !force &&
      deduplicate &&
      cache[query]?.[1] === 'loading' &&
      (deduplicate === true ||
        deduplicate < new Date().getTime() - cache[query]?.[2])
    )
      return cache[query][4] instanceof Promise
        ? (cache[query][4] as Promise<T>)
        : (Promise.resolve(cache[query][0]) as Promise<T>)

    const promise = fetcher(query)
    setCache({ key: query, status: 'loading', promise })

    promise
      .then(value =>
        setCache({
          key: query,
          value,
          status: serverInstance ? 'server loaded' : 'client loaded',
          promise: null,
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
        await fetch(unwrap(key), verifyKey(unwrap(key)))
        // eslint-disable-next-line
      } catch {}
      if (
        ctx &&
        cache[unwrap(key)] &&
        !['loading', 'initialised'].includes(cache[unwrap(key)]?.[1])
      ) {
        if (ctx.nuxt) {
          ctx.nuxt.vsanity[unwrap(key)] = cache[unwrap(key)].slice(0, 3)
        } else {
          ctx.vsanity[unwrap(key)] = cache[unwrap(key)].slice(0, 3)
        }
      }
    })
  }

  const data = computed(() => {
    verifyKey(unwrap(key))

    return (cache[unwrap(key)] && cache[unwrap(key)][0]) as T | K
  })

  const status = computed(() => {
    verifyKey(unwrap(key))

    return cache[unwrap(key)][1]
  })

  const error = computed(() => {
    verifyKey(unwrap(key))

    return cache[unwrap(key)][3]
  })

  if (isRef(key)) {
    watch(
      key,
      key => {
        if (strategy === 'server' && status.value === 'server loaded') return

        fetch(key, verifyKey(key))
      },
      { immediate: true }
    )
  } else if (strategy !== 'server' || status.value !== 'server loaded') {
    fetch(key, verifyKey(key))
  }

  return {
    setCache,
    triggerFetch: fetch,
    fetch,
    data,
    status,
    error,
  }
}
