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

interface CacheOptions<K> {
  initialValue?: K
  clientOnly?: boolean
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
  if (!isServer && !options.clientOnly) {
    const prefetchState =
      (window as any).__VSANITY_STATE__ ||
      ((window as any).__NUXT__ && (window as any).__NUXT__.vsanity)
    if (prefetchState[key.value]) {
      initialValue = prefetchState[key.value]
      status.value = 'server loaded'
    }
  }

  function initialiseKey(key: string) {
    if (!cache[key]) Vue.set(cache, key, initialValue || null)
  }

  async function fetch(query = key.value) {
    Vue.set(cache, query, (await fetcher(query)) || initialValue || null)
  }

  const refetching = ref(false)

  async function triggerFetch(query?: string) {
    if (refetching.value) return
    refetching.value = true
    await fetch(query)
    status.value = 'client loaded'
  }

  if (!options.clientOnly && isServer) {
    if (instance.$ssrContext.nuxt && !instance.$ssrContext.nuxt.vsanity) {
      instance.$ssrContext.nuxt.vsanity = {}
    } else if (!instance.$ssrContext.vsanity) {
      instance.$ssrContext.vsanity = {}
    }

    onServerPrefetch(async () => {
      await fetch()

      if (instance.$ssrContext.nuxt) {
        instance.$ssrContext.nuxt.vsanity[key.value] = cache[key.value]
      } else {
        instance.$ssrContext.vsanity[key.value] = cache[key.value]
      }

      status.value = 'server loaded'
    })
  }

  watch(key, async key => {
    try {
      await fetch(key)
      status.value = 'client loaded'
    } catch (_) {
      status.value = 'error'
    }
  })

  const data = computed(() => {
    initialiseKey(key.value)
    return (cache[key.value] || initialValue || null) as T | K
  })

  return {
    triggerFetch,
    fetch,
    data,
    status,
  }
}
