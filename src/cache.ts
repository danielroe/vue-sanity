import type { VueConstructor } from 'vue'
import {
  computed,
  getCurrentInstance,
  isRef,
  onServerPrefetch,
  reactive,
  Ref,
  set,
  unref,
  watch,
} from 'vue-demi'

/**
 * Cached data, status of fetch, timestamp of last fetch, error
 */
type CacheEntry<T> = [T, FetchStatus, number, any, Promise<T>]

const cache = reactive<Record<string, CacheEntry<any>>>({})

export function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance.proxy as InstanceType<VueConstructor>
}

export function getServerInstance() {
  const instance = getCurrentInstance()

  if (instance?.proxy && (process?.env?.VITE_SSG || instance?.proxy.$isServer))
    return instance.proxy as InstanceType<VueConstructor>
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
    set(cache, key, [value, status, time, error])
  }

  const serverInstance = getServerInstance()
  const k = unref(key)

  if (enableSSR && !serverInstance) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState && prefetchState[k]) {
      const [value, status, time, error] = prefetchState[k] as CacheEntry<T>

      initialiseCache({
        key: k,
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

    set(cache[key], 0, value)
    set(cache[key], 1, status)
    set(cache[key], 2, new Date().getTime())
    set(cache[key], 3, error)
    set(cache[key], 4, promise)
  }

  function fetch(query = unref(key), force?: boolean) {
    if (
      !force &&
      query &&
      cache[query] &&
      cache[query][1] !== 'error' &&
      (cache[query][0] !== initialValue ||
        cache[query][4] instanceof Promise) &&
      deduplicate &&
      (deduplicate === true ||
        deduplicate < new Date().getTime() - cache[query][2])
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
      const k = unref(key)
      try {
        await fetch(k, verifyKey(k))
        // eslint-disable-next-line
      } catch {}
      if (
        ctx &&
        cache[k] &&
        !['loading', 'initialised'].includes(cache[k]?.[1])
      ) {
        if (ctx.nuxt) {
          ctx.nuxt.vsanity[k] = cache[k].slice(0, 3)
        } else {
          ctx.vsanity[k] = cache[k].slice(0, 3)
        }
      }
    })
  }

  const data = computed(() => {
    const k = unref(key)
    if (!k) return initialValue

    verifyKey(k)

    return (cache[k] && cache[k][0]) as T | K
  })

  const status = computed(() => {
    const k = unref(key)
    if (!k) return 'server loaded'

    verifyKey(k)

    return cache[k][1]
  })

  const error = computed(() => {
    const k = unref(key)
    if (!k) return null

    verifyKey(k)

    return cache[k][3]
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
