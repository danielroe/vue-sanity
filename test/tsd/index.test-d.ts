import { expectType, expectError } from 'tsd'

import { useSanityClient, useSanityFetcher } from '../..'
import { Ref } from '@vue/composition-api'

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

/**
 * Require a function passed
 */
expectError(useSanityFetcher('query'))

/**
 * Require a function passed
 */
const { data: noTyping } = useSanityFetcher(() => '')
expectType<Ref<any>>(noTyping)

const { data: stringOrNull } = useSanityFetcher<string>(() => '')
expectType<Ref<string | null>>(stringOrNull)

const { data: stringWithDefault } = useSanityFetcher<string>(() => '', '')
expectType<Ref<string>>(stringWithDefault)

expectError(useSanityFetcher<string>(() => '', 2))

const { data: stringWithDifferentDefault } = useSanityFetcher<string, number>(
  () => '',
  3
)
expectType<Ref<string | number>>(stringWithDifferentDefault)

const { data: stringWithNullDefault } = useSanityFetcher<string, null>(
  () => '',
  null
)
expectType<Ref<string | null>>(stringWithNullDefault)

const { data: inferredResult } = useSanityFetcher(
  () => '',
  1,
  (result: string) => Number(result)
)
expectType<Ref<number>>(inferredResult)

const { data: explicitResult } = useSanityFetcher<number>(
  () => '',
  1,
  (result: string) => Number(result)
)
expectType<Ref<number>>(explicitResult)

const { data: inferredResultWithDefault } = useSanityFetcher(
  () => '',
  'default',
  (result: string) => Number(result)
)
expectType<Ref<number | string>>(inferredResultWithDefault)

const { data: dataWithOptions } = useSanityFetcher(
  () => '',
  'default',
  (result: string) => Number(result),
  {
    clientOnly: true,
  }
)
expectType<Ref<number | string>>(dataWithOptions)
