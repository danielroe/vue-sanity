import { expectError } from 'tsd'

import { useSanityClient } from '../../src'

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
