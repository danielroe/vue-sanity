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

const cache = reactive<Record<string, any>>({})

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

  const status = ref<FetchStatus>('loading')

  let { initialValue } = options

  const enableSSR =
    !options.clientOnly && (!options.strategy || options.strategy !== 'client')

  if (enableSSR && !isServer) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState && prefetchState[key.value]) {
      initialValue = prefetchState[key.value]
      status.value = 'server loaded'
    }
  }

  function initialiseKey(key: string) {
    if (!cache[key]) Vue.set(cache, key, initialValue || null)
  }

  function setCache(key: string, value: any) {
    Vue.set(cache, key, value)
  }

  const error = ref(null)
  async function fetch(query = key.value) {
    try {
      setCache(query, (await fetcher(query)) || initialValue || null)
      status.value = isServer ? 'server loaded' : 'client loaded'
    } catch (e) {
      error.value = e
      status.value = 'error'
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

  watch(key, async key => {
    if (
      options.strategy === 'server' &&
      status.value === 'server loaded' &&
      ![null, initialValue].includes(cache[key])
    )
      return

    await fetch(key)
  })

  const data = computed(() => {
    initialiseKey(key.value)
    return (cache[key.value] || initialValue || null) as T | K
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
