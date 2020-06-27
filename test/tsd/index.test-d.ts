import { expectError } from 'tsd'

import { useSanityClient } from '../..'

/**
 * Need to provide both dataset & projectId
 */
expectError(
  useSanityClient({
    dataset: '',
  })
)
expectError(
  useSanityClient({
    projectId: '',
  })
)
