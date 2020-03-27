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

interface SanityProjectDetails {
  projectId: string
  dataset: string
}

export function useSanityClient(
  config: ClientConfig & SanityProjectDetails,
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

export function useSanityImage(
  image: Ref<ResolvedSanityImage>,
  options?: Partial<ImageOptions>,
  widths = [300, 600, 1200, 1920]
) {
  const builder = inject(imageBuilderSymbol)

  function getImageUrl(
    image: Required<ResolvedSanityImage>,
    width: number,
    { quality = 82, fit = 'min' }: ImageOptions
  ) {
    if (!builder)
      throw new Error(
        'You must call useSanityClient before using sanity resources in this project.'
      )

    return builder
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
  data: Ref<T>
  status: Ref<FetchStatus>
}

type Options = Omit<CacheOptions<any>, 'initialValue'> & {
  listen?: boolean | Record<string, any>
}

export function useSanityFetcher<T extends any>(query: Query): Result<T | null>

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

  if (options?.listen) {
    const previewClient = inject(previewClientSymbol) || inject(clientSymbol)
    if (!previewClient) return

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
