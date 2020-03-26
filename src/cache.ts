import Vue from 'vue'
import CompositionApi, {
  Ref,
  ref,
  reactive,
  watch,
  computed,
  onServerPrefetch,
} from '@vue/composition-api'

Vue.use(CompositionApi)

const cache = reactive<Record<string, any>>({})

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
  function initialiseKey(key: string) {
    if (!cache[key]) Vue.set(cache, key, options.initialValue || null)
  }
  async function fetch(query = key.value) {
    Vue.set(
      cache,
      query,
      (await fetcher(query)) || options.initialValue || null
    )
  }

  const status = ref<FetchStatus>('loading')
  const refetching = ref(false)

  async function triggerFetch(query?: string) {
    if (refetching.value) return
    refetching.value = true
    await fetch(query)
    status.value = 'client loaded'
  }

  if (!options.clientOnly) {
    onServerPrefetch(async () => {
      await fetch()
      status.value = 'server loaded'
    })
  }

  watch(key, async key => {
    if (status.value === 'client loaded') return
    try {
      await fetch(key)
      status.value = 'client loaded'
    } catch (_) {
      status.value = 'error'
    }
  })

  const data = computed(() => {
    initialiseKey(key.value)
    return (cache[key.value] || options.initialValue || null) as T | K
  })

  return {
    triggerFetch,
    fetch,
    data,
    status,
  }
}
