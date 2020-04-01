import {
  computed,
  inject,
  watch,
  InjectionKey,
  Ref,
} from '@vue/composition-api'
import minifier from 'minify-groq'
import { SanityClient } from '@sanity/client'

import { useCache, CacheOptions, FetchStatus } from './cache'

export const clientSymbol: InjectionKey<SanityClient> = Symbol('Sanity client')
export const previewClientSymbol: InjectionKey<SanityClient> = Symbol(
  'Sanity client for previews'
)

type Query = () => string

interface Result<T> {
  /**
   * An automatically synced and updated result of the Sanity query.
   */
  data: Ref<T>
  /**
   * The status of the query. Can be 'server loaded', 'loading', 'client loaded' or 'error'.
   */
  status: Ref<FetchStatus>
}

type Options = Omit<CacheOptions<any>, 'initialValue'> & {
  /**
   * Whether to listen to real-time updates from Sanity. You can also pass an object of options to pass to `client.listen`. Defaults to false.
   */
  listen?: boolean | Record<string, any>
}

/**
 *
 * @param query A function that retuns a query string. If the return value changes, a new Sanity query will be run and the return value automatically updated.
 */
export function useSanityFetcher<T extends any>(query: Query): Result<T | null>

/**
 *
 * @param query A function that retuns a query string. If the return value changes, a new Sanity query will be run and the return value automatically updated.
 * @param initialValue The value to return before the Sanity client returns an actual result. Defaults to null.
 * @param mapper A function that transforms the result from Sanity, before returning it to your component.
 */
export function useSanityFetcher<T extends any, R extends any = T>(
  query: Query,
  initialValue: R,
  mapper?: (result: any) => T,
  options?: Options
): Result<T | R>

export function useSanityFetcher(
  query: Query,
  initialValue = null,
  mapper = (result: any) => result,
  options?: Options
) {
  const client = inject(clientSymbol)
  if (!client)
    throw new Error(
      'You must call useSanityClient before using sanity resources in this project.'
    )

  const computedQuery = computed(() => minifier(query()).replace(/\n/g, ' '))

  const { data, status, setCache } = useCache(
    computedQuery,
    query => client.fetch(query).then(mapper),
    {
      initialValue,
      ...options,
    }
  )

  if (options && options.listen) {
    const previewClient = inject(previewClientSymbol) || client

    const listenOptions =
      typeof options.listen === 'boolean' ? undefined : options.listen

    watch(computedQuery, query => {
      const subscription = previewClient
        .listen(query, listenOptions)
        .subscribe(event => setCache(query, event.result))

      const unwatch = watch(computedQuery, newQuery => {
        if (newQuery !== query) {
          subscription.unsubscribe()
          unwatch()
        }
      })
    })
  }

  return { data, status }
}
