import Vue from 'vue'
import CompositionApi, { provide } from '@vue/composition-api'

import { ClientConfig } from '@sanity/client'

import { useCache, ensureInstance } from './cache'
import { useSanityImage, imageBuilderSymbol } from './image'
import {
  useSanityFetcher,
  useSanityQuery,
  Client,
  Options,
  clientSymbol,
  previewClientSymbol,
  optionsSymbol,
} from './query'

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
  supportPreview = false,
  defaultOptions: Options = {}
) {
  ensureInstance()
  // eslint-disable-next-line
  const sanityClient = require('@sanity/client')
  // eslint-disable-next-line
  const imageUrlBuilder = require('@sanity/image-url')

  const client = sanityClient(config)
  const imageBuilder = imageUrlBuilder(config)

  provide(clientSymbol, client)
  provide(imageBuilderSymbol, imageBuilder)
  provide(optionsSymbol, defaultOptions)

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

export function useCustomClient(client: Client, defaultOptions: Options = {}) {
  ensureInstance()
  provide(clientSymbol, client)
  provide(optionsSymbol, defaultOptions)
}

export { useCache, useSanityFetcher, useSanityImage, useSanityQuery }
