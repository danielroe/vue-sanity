import Vue from 'vue'
import CompositionApi, {
  Ref,
  reactive,
  watch,
  computed,
  onServerPrefetch,
  getCurrentInstance,
} from '@vue/composition-api'

Vue.use(CompositionApi)

/**
 * Cached data, status of fetch, timestamp of last fetch, error
 */
type CacheEntry<T> = [T, FetchStatus, number, any]

const cache = reactive<Record<string, CacheEntry<any>>>({})

export function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance
}

export type FetchStatus =
  | 'initialised'
  | 'loading'
  | 'server loaded'
  | 'client loaded'
  | 'error'

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
   * Whether to de-duplicate fetches. If set to true, additional fetches will not run unless made after
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
  const instance = ensureInstance()
  const isServer = instance.$isServer

  const { deduplicate = false, strategy = 'both', clientOnly = false } = options
  let { initialValue = null } = options

  const enableSSR = !clientOnly && strategy !== 'client'

  function initialiseCache(
    key: string,
    value: any,
    status: FetchStatus = 'initialised',
    time = new Date().getTime(),
    error = null
  ) {
    Vue.set(cache, key, [value, status, time, error])
  }

  if (enableSSR && !isServer) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState && prefetchState[key.value]) {
      initialValue = prefetchState[key.value][0]
      initialiseCache(
        key.value,
        ...(prefetchState[key.value] as CacheEntry<any>)
      )
    }
  }

  function verifyKey(key: string) {
    const emptyCache = !(key in cache)
    if (emptyCache) initialiseCache(key, initialValue)
    return emptyCache || cache[key][1] === 'initialised'
  }

  function setCache(
    key: string,
    value: any = (cache[key] && cache[key][0]) || initialValue,
    status: FetchStatus = cache[key] && cache[key][1],
    error: any = null
  ) {
    if (!(key in cache)) initialiseCache(key, value, status)
    Vue.set(cache[key], 0, value)
    Vue.set(cache[key], 1, status)
    Vue.set(cache[key], 2, new Date().getTime())
    Vue.set(cache[key], 3, error)
  }

  async function fetch(query = key.value, force?: boolean) {
    if (
      !force &&
      deduplicate &&
      cache[query][1] === 'loading' &&
      (deduplicate === true ||
        deduplicate < new Date().getTime() - cache[query][2])
    )
      return

    try {
      setCache(query, undefined, 'loading')

      setCache(
        query,
        await fetcher(query),
        isServer ? 'server loaded' : 'client loaded'
      )
    } catch (e) {
      setCache(query, undefined, 'error', e)
    }
  }

  if (enableSSR && isServer) {
    if (instance.$ssrContext) {
      if (instance.$ssrContext.nuxt && !instance.$ssrContext.nuxt.vsanity) {
        instance.$ssrContext.nuxt.vsanity = {}
      } else if (!instance.$ssrContext.vsanity) {
        instance.$ssrContext.vsanity = {}
      }
    }

    onServerPrefetch(async () => {
      await fetch(key.value, true)
      if (instance.$ssrContext) {
        if (instance.$ssrContext.nuxt) {
          instance.$ssrContext.nuxt.vsanity[key.value] = cache[key.value]
        } else {
          instance.$ssrContext.vsanity[key.value] = cache[key.value]
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

  watch(key, async key => {
    if (strategy === 'server' && status.value === 'server loaded') return

    await fetch(key, verifyKey(key))
  })

  return {
    setCache,
    triggerFetch: fetch,
    fetch,
    data,
    status,
    error,
  }
}
