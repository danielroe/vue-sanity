import Vue from 'vue'
import CompositionApi, { provide } from '@vue/composition-api'

import sanityClient, { ClientConfig } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

import { useCache, ensureInstance } from './cache'
import { useSanityImage, imageBuilderSymbol } from './image'
import { useSanityFetcher, clientSymbol, previewClientSymbol } from './query'

Vue.use(CompositionApi)

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

export { useCache, useSanityFetcher, useSanityImage }
