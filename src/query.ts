import type { SanityClient } from '@sanity/client'
import type { QueryBuilder } from 'sanity-typed-queries'
import type { InjectionKey, Ref } from 'vue'
import type { CacheOptions, FetchStatus } from './cache'
import minifier from 'minify-groq'

import { computed, inject, isRef, watch } from 'vue'
import { useCache } from './cache'

export interface Client {
  fetch: (query: string) => Promise<any>
  [key: string]: any
}

export const clientSymbol: InjectionKey<Client> = Symbol('Sanity client')
export const previewClientSymbol: InjectionKey<SanityClient> = Symbol(
  'Sanity client for previews',
)
export const optionsSymbol: InjectionKey<Options> = Symbol(
  'Default query options',
)

type Query = string | (() => string | null | undefined | false)
type QueryReturnType<T> = [string, T]

interface Result<T> {
  /**
   * An automatically synced and updated result of the Sanity query.
   */
  data: Ref<T>
  /**
   * The status of the query. Can be 'server loaded', 'loading', 'client loaded' or 'error'.
   */
  status: Ref<FetchStatus>
  /**
   * An error returned in the course of fetching
   */
  error: any
  /**
   * Get result directly from fetcher (integrates with cache)
   */
  fetch: () => Promise<T>
}

export type Options = Omit<CacheOptions<any>, 'initialValue'> & {
  /**
   * Whether to listen to real-time updates from Sanity. You can also pass an object of options to pass to `client.listen`. Defaults to false.
   */
  listen?: boolean | Record<string, any>
}

/**
 *
 * @param query A string, or a function that retuns a query string. If the return value changes, a new Sanity query will be run and the return value automatically updated.
 */
export function useSanityFetcher<T>(query: Query): Result<T | null>

/**
 *
 * @param query A function that retuns a query string. If the return value changes, a new Sanity query will be run and the return value automatically updated.
 * @param initialValue The value to return before the Sanity client returns an actual result. Defaults to null.
 * @param mapper A function that transforms the result from Sanity, before returning it to your component.
 */
export function useSanityFetcher<T, R = T>(
  query: Query,
  initialValue: R,
  mapper?: (result: any) => T,
  options?: Options
): Result<T | R>

export function useSanityFetcher(
  query: Query,
  initialValue = null,
  mapper = (result: any) => result,
  queryOptions?: Options,
) {
  const client = inject(clientSymbol)
  const defaultOptions = inject(optionsSymbol, {})

  const options = {
    ...defaultOptions,
    initialValue,
    ...queryOptions,
  }
  if (!client) {
    throw new Error(
      'You must call useSanityClient before using sanity resources in this project.',
    )
  }

  const computedQuery
    = typeof query === 'string'
      ? minifier(query).replace(/\n/g, ' ')
      : computed(() => minifier(query() || '').replace(/\n/g, ' '))

  const { data, status, setCache, error, fetch } = useCache(
    computedQuery,
    query =>
      query ? client.fetch(query).then(mapper) : Promise.resolve(initialValue),
    options,
  )

  if (options.listen) {
    const previewClient = inject(previewClientSymbol, client as SanityClient)
    if ('listen' in previewClient) {
      const listenOptions
        = typeof options.listen === 'boolean' ? undefined : options.listen

      const subscribe = (query: string) =>
        previewClient.listen(query, listenOptions).subscribe(
          event =>
            event.result
            && setCache({
              key: query,
              value: event.result,
            }),
        )
      if (isRef(computedQuery)) {
        watch(
          computedQuery,
          (query) => {
            const subscription = subscribe(query)

            const unwatch = watch(
              computedQuery,
              (newQuery) => {
                if (newQuery !== query) {
                  subscription.unsubscribe()
                  unwatch()
                }
              },
              { immediate: true },
            )
          },
          { immediate: true },
        )
      }
      else {
        subscribe(computedQuery)
      }
    }
  }

  return { data, status, error, fetch }
}

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type extends Record<string, QueryReturnType<any>>,
  Project extends boolean,
  Exclude extends string,
>(
  builder: Builder | (() => Builder)
): Result<
  ReturnType<Builder['use']>[1] extends Array<any>
    ? ReturnType<Builder['use']>[1]
    : ReturnType<Builder['use']>[1] | null
>

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type,
  Project extends boolean,
  Exclude extends string,
>(
  builder: Builder | (() => Builder),
  initialValue: null
): Result<ReturnType<Builder['use']>[1] | null>

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type,
  Project extends boolean,
  Exclude extends string,
  InitialValue,
>(
  builder: Builder | (() => Builder),
  initialValue: InitialValue
): Result<ReturnType<Builder['use']>[1] | InitialValue>

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type,
  Project extends boolean,
  Exclude extends string,
  Mapper extends (result: ReturnType<Builder['use']>[1]) => any,
>(
  builder: Builder | (() => Builder),
  initialValue: null,
  mapper: Mapper,
  options?: Options
): Result<ReturnType<Mapper> | null>

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type,
  Project extends boolean,
  Exclude extends string,
  InitialValue,
  Mapper extends (result: ReturnType<Builder['use']>[1]) => any,
>(
  builder: Builder | (() => Builder),
  initialValue: InitialValue,
  mapper: Mapper,
  options?: Options
): Result<ReturnType<Mapper> | InitialValue>

export function useSanityQuery<
  Builder extends Pick<
    QueryBuilder<Schema, Mappings, Subqueries, Type, Project, Exclude>,
    'use'
  >,
  Schema extends Record<string, any>,
  Mappings extends Record<string, any>,
  Subqueries extends Record<string, QueryReturnType<any>>,
  Type,
  Project extends boolean,
  Exclude extends string,
>(
  builder: Builder | (() => Builder),
  initialValue = null,
  mapper = (result: any) => result,
  options?: Options,
) {
  const query
    = 'use' in builder ? () => builder.use()[0] : () => builder().use()[0]
  const type = 'use' in builder ? builder.use()[1] : builder().use()[1]

  return useSanityFetcher<typeof type>(
    query,
    initialValue || type,
    mapper,
    options,
  )
}
