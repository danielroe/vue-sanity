import {
  computed,
  getCurrentInstance,
  isRef,
  reactive,
  Ref,
  unref,
  watch,
} from 'vue'

/**
 * Cached data, status of fetch, timestamp of last fetch, error
 */
type CacheEntry<T> = [T, FetchStatus, number, any, Promise<T> | null]

const cache = reactive<Record<string, CacheEntry<any>>>({})

export function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance
}

export type FetchStatus = 'initialised' | 'loading' | 'client loaded' | 'error'

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
   * Strategy for fetching. Defaults to 'client'.
   * 'client' will disable SSR fetching. (not yet supported by vue-sanity@next)
   */
  strategy?: 'client'
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
  const { initialValue = null, deduplicate = false } = options

  function initialiseCache({
    key,
    value,
    error = null,
    status = 'initialised',
    time = new Date().getTime(),
  }: SetCacheOptions<T, K>) {
    cache[key] = [value, status, time, error, null]
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
    promise = cache[key]?.[4] || null,
  }: SetCacheOptions<T, K>) {
    if (!(key in cache)) initialiseCache({ key, value, status })

    cache[key][0] = value
    cache[key][1] = status
    cache[key][2] = new Date().getTime()
    cache[key][3] = error
    cache[key][4] = promise
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
          status: 'client loaded',
          promise: null,
        })
      )
      .catch(error => setCache({ key: query, status: 'error', error }))
    return promise
  }

  const data = computed(() => {
    const k = unref(key)
    if (!k) return initialValue

    verifyKey(k)

    return (cache[k] && cache[k][0]) as T | K
  })

  const status = computed(() => {
    const k = unref(key)
    if (!k) return 'initialised'

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
        fetch(key, verifyKey(key))
      },
      { immediate: true }
    )
  } else {
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
