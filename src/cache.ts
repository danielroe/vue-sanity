import Vue from 'vue'
import CompositionApi, {
  Ref,
  ref,
  reactive,
  watch,
  computed,
  onServerPrefetch,
  getCurrentInstance,
} from '@vue/composition-api'

Vue.use(CompositionApi)

type CacheEntry<T> = [T, FetchStatus]

const cache = reactive<Record<string, CacheEntry<any>>>({})

export function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance
}

export type FetchStatus =
  | 'server loaded'
  | 'loading'
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
}

export function useCache<T, K = null>(
  key: Ref<string>,
  fetcher: (key: string) => Promise<T>,
  options: CacheOptions<K> = {}
) {
  const instance = ensureInstance()
  const isServer = instance.$isServer

  let { initialValue = null } = options

  const enableSSR =
    !options.clientOnly && (!options.strategy || options.strategy !== 'client')

  function initialiseCache(
    key: string,
    value: any = initialValue,
    status: FetchStatus = 'loading'
  ) {
    Vue.set(cache, key, [value, status])
  }

  if (enableSSR && !isServer) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState && prefetchState[key.value]) {
      initialValue = prefetchState[key.value][0]
      initialiseCache(
        key.value,
        prefetchState[key.value][0],
        prefetchState[key.value][1]
      )
    }
  }

  function setCache(
    key: string,
    value: any = (cache[key] && cache[key][0]) || initialValue,
    status: FetchStatus = (cache[key] && cache[key][1]) || 'loading'
  ) {
    if (!cache[key]) {
      initialiseCache(key, value, status)
    } else {
      Vue.set(cache[key], 0, value)
      Vue.set(cache[key], 1, status)
    }
  }

  const error = ref(null)
  async function fetch(query = key.value) {
    try {
      setCache(
        query,
        await fetcher(query),
        isServer ? 'server loaded' : 'client loaded'
      )
    } catch (e) {
      error.value = e
      setCache(query, undefined, 'error')
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
      await fetch()
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
    if (!cache[key.value]) return initialValue as K

    return (cache[key.value] && cache[key.value][0]) as T
  })

  const status = computed(() => {
    if (!cache[key.value]) return 'loading'

    return cache[key.value][1]
  })

  watch(key, async key => {
    if (!cache[key]) initialiseCache(key)

    if (options.strategy === 'server' && status.value === 'server loaded')
      return

    await fetch(key)
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
