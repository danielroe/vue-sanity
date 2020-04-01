import { expectType, expectError } from 'tsd'
import { Ref } from '@vue/composition-api'
import { createSchema } from 'sanity-typed-queries'

import { useSanityFetcher } from '../../src'
import { useSanityQuery } from '../../src/query'

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

/**
 * Expect sanity-typed-queries type inference to work
 */

const { builder } = createSchema('author', {
  name: {
    type: 'string',
    validation: Rule => Rule.required(),
  },
  tags: {
    type: 'array',
    of: [{ type: 'string' }, { type: 'number' }],
  },
  cost: {
    type: 'number',
  },
  description: {
    type: 'text',
    rows: 2,
    validation: Rule => Rule.required(),
  },
})

const result1 = useSanityQuery(builder.pick('description'))
expectType<Ref<string[]>>(result1.data)

const result2 = useSanityQuery(builder.pick('description').first())
expectType<Ref<string | null>>(result2.data)

const result2a = useSanityQuery(builder.pick('description').first(), null)
expectType<Ref<string | null>>(result2a.data)

const result3 = useSanityQuery(builder.pick('description').first(), 23)
expectType<Ref<string | number>>(result3.data)

const result4 = useSanityQuery(
  builder.pick('description').first(),
  23,
  result => ({
    result: Number(result),
  })
)
expectType<Ref<number | { result: number }>>(result4.data)

const result5 = useSanityQuery(
  builder.pick('description').first(),
  null,
  result => Number(result)
)
expectType<Ref<number | null>>(result5.data)

const result6 = useSanityQuery(
  builder.pick('description').first(),
  null,
  result => ({
    result: Number(result),
  }),
  { clientOnly: true }
)
expectType<Ref<{ result: number } | null>>(result6.data)
