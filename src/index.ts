import Vue from 'vue'
import CompositionApi, {
  provide,
  inject,
  InjectionKey,
  computed,
  Ref,
  watch,
} from '@vue/composition-api'

import sanityClient, { SanityClient, ClientConfig } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder'
import {
  FitMode,
  SanityImageDimensions,
} from '@sanity/image-url/lib/types/types'

import minifier from 'minify-groq'

import { CacheOptions, useCache, ensureInstance, FetchStatus } from './cache'

Vue.use(CompositionApi)

const clientSymbol: InjectionKey<SanityClient> = Symbol('Sanity client')
const previewClientSymbol: InjectionKey<SanityClient> = Symbol(
  'Sanity client for previews'
)
const imageBuilderSymbol: InjectionKey<ImageUrlBuilder> = Symbol(
  'Sanity image URL builder'
)

interface RequiredConfig {
  /**
   * Your project ID. You can find it in your sanity.json.
   */
  projectId: string
  /**
   * You must specify which dataset to use. You can find it in your sanity.json.
   */
  dataset: string
}

/**
 *
 * @param supportPreview Whether to create a preview client (that won't use CDN, and supports credentials for viewing drafts). Defaults to false.
 */
export function useSanityClient(
  config: ClientConfig & RequiredConfig,
  supportPreview = false
) {
  ensureInstance()

  const client = sanityClient(config)
  const imageBuilder = imageUrlBuilder(config)

  provide(clientSymbol, client)
  provide(imageBuilderSymbol, imageBuilder)

  if (supportPreview) {
    const previewClient = sanityClient({
      ...config,
      useCdn: false,
      token: undefined,
      withCredentials: true,
    })
    provide(previewClientSymbol, previewClient)
  }
}

export interface ResolvedSanityImage {
  url: string
  dimensions?: SanityImageDimensions
}

interface ImageOptions {
  dpr?: number
  quality?: number
  fit?: FitMode
}

/**
 *
 * WARNING. Work in progress. API may change.
 */
export function useSanityImage(
  image: Ref<ResolvedSanityImage>,
  options?: Partial<ImageOptions>,
  widths = [300, 600, 1200, 1920]
) {
  const builder = inject(imageBuilderSymbol)

  if (!builder)
    throw new Error(
      'You must call useSanityClient before using sanity resources in this project.'
    )

  function getImageUrl(
    image: Required<ResolvedSanityImage>,
    width: number,
    { quality = 82, fit = 'min' }: ImageOptions
  ) {
    return (builder as ImageUrlBuilder)
      .image(image.url)
      .width(Math.round(width))
      .height(Math.round(Number(width / image.dimensions.aspectRatio)))
      .quality(quality)
      .fit(fit)
      .url()
  }

  const result = computed(() => ({
    src: image.value.url,
    ...(image.value.dimensions
      ? {
          srcset: [
            ...widths.map(
              width =>
                `${getImageUrl(
                  image.value as Required<ResolvedSanityImage>,
                  width,
                  options || {}
                )} ${width}w`
            ),
            `${image.value.url} ${image.value.dimensions.width}w`,
          ].join(', '),
          placeholder: '',
          sizes: [
            ...widths.map(width => `(max-width: ${width + 100}px) ${width}px`),
            `${image.value.dimensions.width}px`,
          ].join(', '),
        }
      : {}),
  }))

  return result
}

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

  const computedQuery = computed(query)

  const { data, status, setCache } = useCache(
    computedQuery,
    query => client.fetch(minifier(query)).then(mapper),
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

export { useCache }
