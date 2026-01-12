import type { ClientConfig } from '@sanity/client'

import type { CacheOptions, FetchStatus } from './cache'
import type { Client, Options } from './query'
import { createClient } from '@sanity/client'

import imageUrlBuilder from '@sanity/image-url'
import { inject, provide } from 'vue'
import { ensureInstance, useCache } from './cache'
import { imageBuilderSymbol, useSanityImage } from './image'
import { clientSymbol, optionsSymbol, previewClientSymbol, useSanityFetcher, useSanityQuery } from './query'

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
 * @param config The configuration for the client.
 * @param supportPreview Whether to create a preview client (that won't use CDN, and supports credentials for viewing drafts). Defaults to false.
 * @param defaultOptions Default options for the fetcher.
 */
export function useSanityClient(
  config: ClientConfig & RequiredConfig,
  supportPreview = false,
  defaultOptions: Options = {},
) {
  ensureInstance()

  const client = createClient(config)
  const imageBuilder = imageUrlBuilder(config)

  provide(clientSymbol, client)
  provide(imageBuilderSymbol, imageBuilder)
  provide(optionsSymbol, defaultOptions)

  if (supportPreview) {
    const previewClient = createClient({
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

export function fetch(query: string) {
  ensureInstance()
  const client = inject(clientSymbol)
  if (!client) {
    throw new Error(
      'You must call useSanityClient before using sanity resources in this project.',
    )
  }
  return client.fetch(query)
}

export { useCache, useSanityFetcher, useSanityImage, useSanityQuery }
export type { CacheOptions, FetchStatus, Options }
