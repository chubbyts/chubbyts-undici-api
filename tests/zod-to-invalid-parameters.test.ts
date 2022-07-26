import { describe, expect, test } from '@jest/globals';
import { ZodError, ZodIssueCode } from 'zod';
import { zodToInvalidParameters } from '../src/zod-to-invalid-parameters';

describe('zodToInvalidParameters', () => {
  test('with one error', () => {
    const error = new ZodError([{ code: 'custom', message: 'Error1', path: ['path', 0, 'field'] }]);

    expect(zodToInvalidParameters(error)).toMatchInlineSnapshot(`
      Array [
        Object {
          "context": Object {
            "code": "custom",
          },
          "name": "path[0].field",
          "reason": "Error1",
        },
      ]
    `);
  });

  test('with multiple error', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        message: 'Invalid type',
        path: ['path', 0, 'to', 0, 'field'],
        expected: 'string',
        received: 'number',
      },
      {
        code: 'invalid_literal',
        message: 'Invalid literal',
        path: ['path', 0, 'to', 1, 'field'],
        expected: 'string',
      },
      {
        code: 'unrecognized_keys',
        message: 'Unrecognized keys',
        path: ['path', 0, 'to', 2, 'field'],
        keys: ['key1', 'key2'],
      },
      {
        code: 'invalid_union',
        message: 'Invalid union',
        path: ['path', 0, 'to', 3, 'field'],
        unionErrors: [new ZodError([{ code: 'custom', message: 'Custom', path: [0, 1, 2] }])],
      },
      {
        code: 'invalid_union_discriminator',
        message: 'Invalid union discriminator',
        path: ['path', 0, 'to', 4, 'field'],
        options: ['option', 1, 1.1, true],
      },
      {
        code: 'invalid_enum_value',
        message: 'Invalid enum value',
        path: ['path', 0, 'to', 5, 'field'],
        options: ['option', 1],
        received: 2,
      },
      {
        code: 'invalid_arguments',
        message: 'Invalid arguments',
        path: ['path', 0, 'to', 6, 'field'],
        argumentsError: new ZodError([{ code: 'custom', message: 'Custom', path: [0, 'key', 1] }]),
      },
      {
        code: 'invalid_return_type',
        message: 'Invalid return type',
        path: ['path', 0, 'to', 7, 'field'],
        returnTypeError: new ZodError([{ code: 'custom', message: 'Custom', path: ['key1', 0, 'key2'] }]),
      },
      {
        code: 'invalid_date',
        message: 'Invalid date',
        path: ['path', 0, 'to', 8, 'field'],
      },
      {
        code: 'invalid_string',
        message: 'Invalid_string',
        path: ['path', 0, 'to', 9, 'field'],
        validation: 'email',
      },
      {
        code: 'too_small',
        message: 'Too small',
        path: ['path', 0, 'to', 10, 'field'],
        minimum: 1,
        inclusive: true,
        type: 'string',
      },
      {
        code: 'too_big',
        message: 'Too big',
        path: ['path', 0, 'to', 11, 'field'],
        maximum: 10,
        inclusive: true,
        type: 'string',
      },
      {
        code: 'invalid_intersection_types',
        message: 'Invalid intersection types',
        path: ['path', 0, 'to', 12, 'field'],
      },
      {
        code: 'not_multiple_of',
        message: 'Not multiple of',
        path: ['path', 0, 'to', 13, 'field'],
        multipleOf: 2,
      },
      {
        code: 'custom',
        message: 'Custom',
        path: ['path', 0, 'to', 14, 'field'],
        context: { key1: 'value', key2: new Date('2022-01-01'), key3: new Error('error') },
      },
    ]);

    expect(zodToInvalidParameters(error)).toMatchInlineSnapshot(`
      Array [
        Object {
          "context": Object {
            "code": "invalid_type",
            "expected": "string",
            "received": "number",
          },
          "name": "path[0].to[0].field",
          "reason": "Invalid type",
        },
        Object {
          "context": Object {
            "code": "invalid_literal",
            "expected": "string",
          },
          "name": "path[0].to[1].field",
          "reason": "Invalid literal",
        },
        Object {
          "context": Object {
            "code": "unrecognized_keys",
            "keys": Array [
              "key1",
              "key2",
            ],
          },
          "name": "path[0].to[2].field",
          "reason": "Unrecognized keys",
        },
        Object {
          "context": Object {
            "code": "invalid_union",
            "unionErrors": Array [
              Array [
                Object {
                  "context": Object {
                    "code": "custom",
                  },
                  "name": "[0][1][2]",
                  "reason": "Custom",
                },
              ],
            ],
          },
          "name": "path[0].to[3].field",
          "reason": "Invalid union",
        },
        Object {
          "context": Object {
            "code": "invalid_union_discriminator",
            "options": Array [
              "option",
              1,
              1.1,
              true,
            ],
          },
          "name": "path[0].to[4].field",
          "reason": "Invalid union discriminator",
        },
        Object {
          "context": Object {
            "code": "invalid_enum_value",
            "options": Array [
              "option",
              1,
            ],
            "received": 2,
          },
          "name": "path[0].to[5].field",
          "reason": "Invalid enum value",
        },
        Object {
          "context": Object {
            "argumentsError": Array [
              Object {
                "context": Object {
                  "code": "custom",
                },
                "name": "[0]key[1].",
                "reason": "Custom",
              },
            ],
            "code": "invalid_arguments",
          },
          "name": "path[0].to[6].field",
          "reason": "Invalid arguments",
        },
        Object {
          "context": Object {
            "code": "invalid_return_type",
            "returnTypeError": Array [
              Object {
                "context": Object {
                  "code": "custom",
                },
                "name": "key1[0].key2",
                "reason": "Custom",
              },
            ],
          },
          "name": "path[0].to[7].field",
          "reason": "Invalid return type",
        },
        Object {
          "context": Object {
            "code": "invalid_date",
          },
          "name": "path[0].to[8].field",
          "reason": "Invalid date",
        },
        Object {
          "context": Object {
            "code": "invalid_string",
            "validation": "email",
          },
          "name": "path[0].to[9].field",
          "reason": "Invalid_string",
        },
        Object {
          "context": Object {
            "code": "too_small",
            "inclusive": true,
            "minimum": 1,
            "type": "string",
          },
          "name": "path[0].to[10].field",
          "reason": "Too small",
        },
        Object {
          "context": Object {
            "code": "too_big",
            "inclusive": true,
            "maximum": 10,
            "type": "string",
          },
          "name": "path[0].to[11].field",
          "reason": "Too big",
        },
        Object {
          "context": Object {
            "code": "invalid_intersection_types",
          },
          "name": "path[0].to[12].field",
          "reason": "Invalid intersection types",
        },
        Object {
          "context": Object {
            "code": "not_multiple_of",
            "multipleOf": 2,
          },
          "name": "path[0].to[13].field",
          "reason": "Not multiple of",
        },
        Object {
          "context": Object {
            "code": "custom",
            "context": Object {
              "key1": "value",
              "key2": "2022-01-01T00:00:00.000Z",
              "key3": "**filtered**",
            },
          },
          "name": "path[0].to[14].field",
          "reason": "Custom",
        },
      ]
    `);
  });
});
