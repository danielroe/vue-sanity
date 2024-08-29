import { expectTypeOf } from 'expect-type'
import type { Ref } from 'vue'
import { defineDocument } from 'sanity-typed-queries'

import { mount } from '@vue/test-utils'

import { describe, expect, it, vi } from 'vitest'

import { useSanityClient, useSanityFetcher, useSanityQuery } from '../..'
import { runInSetup } from '../helpers/mount'

const mockFetch = vi.fn(async (key: string) => `return value-${key}`)
;(globalThis.console.error as any) = vi.fn()

const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn((callback: (result: any) => void) => {
  callback({ result: 'sub update' })
  return {
    unsubscribe: mockUnsubscribe,
  }
})
const mockListen = vi.fn(() => ({
  subscribe: mockSubscribe,
}))

vi.mock('@sanity/client', () => {
  return {
    createClient: vi.fn().mockImplementation(() => {
      return { fetch: mockFetch, listen: mockListen }
    }),
  }
})

describe('useSanityFetcher', () => {
  it('requires a function or string passed', async () => {
    await runInSetup(() => {
      // @ts-expect-error must provide a string
      useSanityFetcher(32)
    })

    expect(true).toBeTruthy()
  })
  it('returns the correct types', async () => {
    mount({
      setup() {
        useSanityClient({
          dataset: 'test',
          projectId: 'test',
        })
      },
      render(h) {
        return h({
          render(h) {
            return h('div')
          },
          setup() {
            /**
             * Require a function passed
             */
            const { data: noTyping } = useSanityFetcher(() => '')
            expectTypeOf(noTyping).toEqualTypeOf<Ref<unknown>>()

            const { data: stringOrNull } = useSanityFetcher<string>(() => '')
            expectTypeOf(stringOrNull).toEqualTypeOf<Ref<string | null>>()

            const { data: stringWithDefault } = useSanityFetcher<string>(() => '', '')
            expectTypeOf(stringWithDefault).toEqualTypeOf<Ref<string>>()

            // @ts-expect-error the initial value must match the generic provided
            useSanityFetcher<string>(() => '', 2)

            const { data: stringWithDifferentDefault } = useSanityFetcher<
              string,
              number
            >(() => '', 3)
            expectTypeOf(stringWithDifferentDefault).toEqualTypeOf<
              Ref<string | number>
            >()

            const { data: stringWithNullDefault } = useSanityFetcher<
              string,
              null
            >(() => '', null)
            expectTypeOf(stringWithNullDefault).toEqualTypeOf<
              Ref<string | null>
            >()

            const { data: inferredResult } = useSanityFetcher(
              () => '',
              1,
              (result: string) => Number(result),
            )
            expectTypeOf(inferredResult).toEqualTypeOf<Ref<number>>()

            const { data: explicitResult } = useSanityFetcher<number>(
              () => '',
              1,
              (result: string) => Number(result),
            )
            expectTypeOf(explicitResult).toEqualTypeOf<Ref<number>>()

            const { data: inferredResultWithDefault } = useSanityFetcher(
              () => '',
              'default',
              (result: string) => Number(result),
            )
            expectTypeOf(inferredResultWithDefault).toEqualTypeOf<
              Ref<number | string>
            >()

            const { data: dataWithOptions } = useSanityFetcher(
              () => '',
              'default',
              (result: string) => Number(result),
              {
                clientOnly: true,
              },
            )
            expectTypeOf(dataWithOptions).toEqualTypeOf<Ref<number | string>>()

            /**
             * Expect sanity-typed-queries type inference to work
             */

            const { builder } = defineDocument('author', {
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
            expectTypeOf(result1.data).toEqualTypeOf<Ref<Array<string | undefined>>>()

            const result2 = useSanityQuery(builder.pick('description').first())
            expectTypeOf(result2.data).toEqualTypeOf<Ref<string | null | undefined>>()

            const result2a = useSanityQuery(
              builder.pick('description').first(),
              null,
            )
            expectTypeOf(result2a.data).toEqualTypeOf<Ref<string | null | undefined>>()

            const result3 = useSanityQuery(
              builder.pick('description').first(),
              23,
            )
            expectTypeOf(result3.data).toEqualTypeOf<Ref<string | number | undefined>>()

            const result4 = useSanityQuery(
              builder.pick('description').first(),
              23,
              result => ({
                result: Number(result),
              }),
            )
            expectTypeOf(result4.data).toEqualTypeOf<
              Ref<number | { result: number }>
            >()

            const result5 = useSanityQuery(
              builder.pick('description').first(),
              null,
              result => Number(result),
            )
            expectTypeOf(result5.data).toEqualTypeOf<Ref<number | null>>()

            const result6 = useSanityQuery(
              builder.pick('description').first(),
              null,
              result => ({
                result: Number(result),
              }),
              { clientOnly: true },
            )
            expectTypeOf(result6.data).toEqualTypeOf<
              Ref<{ result: number } | null>
            >()

            const result7 = useSanityQuery(
              () => builder.pick('description').first(),
              null,
              result => ({
                result: Number(result),
              }),
              { clientOnly: true },
            )
            expectTypeOf(result7.data).toEqualTypeOf<
              Ref<{ result: number } | null>
            >()
          },
        })
      },
    })

    expect(true).toBeTruthy()
  })
})
