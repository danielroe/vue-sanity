import { Ref, inject, computed, InjectionKey } from '@vue/composition-api'

import {
  FitMode,
  SanityImageDimensions,
} from '@sanity/image-url/lib/types/types'
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder'

export const imageBuilderSymbol: InjectionKey<ImageUrlBuilder> = Symbol(
  'Sanity image URL builder'
)

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
      .quality(quality)
      .fit(fit)
      .auto('format')
      .url()
  }

  const result = computed(() => ({
    src: image.value.url + '?auto=format',
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
            `${image.value.url + '?auto=format'} ${image.value.dimensions.width}w`,
          ].join(', '),
          placeholder: '',
        }
      : {
          srcset: [
            ...widths.map(
              width =>
                `${getImageUrl(
                  image.value as Required<ResolvedSanityImage>,
                  width,
                  options || {}
                )} ${width}w`
            ),
          ].join(', '),
          placeholder: '',
        }),
  }))

  return result
}
