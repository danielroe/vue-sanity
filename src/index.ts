import Vue from 'vue'
import CompositionApi, {
  provide,
  getCurrentInstance,
  inject,
  InjectionKey,
  computed,
  Ref,
} from '@vue/composition-api'

import sanityClient, { SanityClient, ClientConfig } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder'
import {
  FitMode,
  SanityImageDimensions,
} from '@sanity/image-url/lib/types/types'

import minifier from 'minify-groq'

import { useCache } from './cache'

Vue.use(CompositionApi)

const clientSymbol: InjectionKey<SanityClient> = Symbol('Sanity client')
const imageBuilderSymbol: InjectionKey<ImageUrlBuilder> = Symbol(
  'Sanity image URL builder'
)

function ensureInstance() {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('You must call this from within a component')
  return instance
}

interface SanityProjectDetails {
  projectId: string
  dataset: string
}

export function provideSanityClient(client: SanityClient) {
  ensureInstance()

  const imageBuilder = imageUrlBuilder(client.config() as any)

  provide(clientSymbol, client)
  provide(imageBuilderSymbol, imageBuilder)
}

export function useSanityClient(config: ClientConfig & SanityProjectDetails) {
  ensureInstance()

  const client = sanityClient(config)
  const imageBuilder = imageUrlBuilder(config)

  provide(clientSymbol, client)
  provide(imageBuilderSymbol, imageBuilder)
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

export function useSanityFetcher<T, I = null, K = T>(
  query: () => string,
  map = (result: T) => (result as unknown) as K,
  initialValue?: I
) {
  const client = inject(clientSymbol)
  if (!client)
    throw new Error(
      'You must call useSanityClient before using sanity resources in this project.'
    )

  const { data, status } = useCache<K, I>(
    computed(query),
    query => client.fetch(minifier(query)).then(map),
    initialValue
  )

  return { data, status }
}
