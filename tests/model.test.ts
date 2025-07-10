import { describe, expect, test } from 'vitest';

import type { BaseModel } from '../src/model';
import {
  baseInputModelListSchema,
  baseModelSchema,
  dateSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '../src/model';

describe('model', () => {
  describe('stringSchema', () => {
    test('success', async () => {
      expect(stringSchema.parse('t')).toBe('t');
    });

    test('failed', async () => {
      try {
        stringSchema.parse('');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "code": "too_small",
              "minimum": 1,
              "type": "string",
              "inclusive": true,
              "exact": false,
              "message": "String must contain at least 1 character(s)",
              "path": []
            }
          ]]
        `);
      }
    });
  });

  describe('numberSchema', () => {
    test('success', async () => {
      expect(numberSchema.parse('1')).toBe(1);
      expect(numberSchema.parse(1)).toBe(1);
    });

    test('failed', async () => {
      try {
        numberSchema.parse('t');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "code": "invalid_union",
              "unionErrors": [
                {
                  "issues": [
                    {
                      "code": "custom",
                      "message": "Invalid input",
                      "path": []
                    }
                  ],
                  "name": "ZodError"
                },
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "number",
                      "received": "string",
                      "path": [],
                      "message": "Expected number, received string"
                    }
                  ],
                  "name": "ZodError"
                }
              ],
              "path": [],
              "message": "Invalid input"
            }
          ]]
        `);
      }
    });
  });

  describe('dateSchema', () => {
    test('success', async () => {
      const date = new Date();

      expect(dateSchema.parse(date)).toEqual(date);
      expect(dateSchema.parse(date.toJSON())).toEqual(date);
      expect(dateSchema.parse(date.getTime())).toEqual(date);
    });

    test('failed', async () => {
      try {
        dateSchema.parse('t');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "code": "invalid_union",
              "unionErrors": [
                {
                  "issues": [
                    {
                      "code": "custom",
                      "message": "Invalid input",
                      "path": []
                    }
                  ],
                  "name": "ZodError"
                },
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "number",
                      "received": "string",
                      "path": [],
                      "message": "Expected number, received string"
                    }
                  ],
                  "name": "ZodError"
                },
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "date",
                      "received": "string",
                      "path": [],
                      "message": "Expected date, received string"
                    }
                  ],
                  "name": "ZodError"
                }
              ],
              "path": [],
              "message": "Invalid input"
            }
          ]]
        `);
      }
    });
  });

  describe('sortSchema', () => {
    test('success', async () => {
      expect(sortSchema.parse('asc')).toBe('asc');
      expect(sortSchema.parse('desc')).toBe('desc');
    });

    test('failed', async () => {
      try {
        sortSchema.parse('');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "received": "",
              "code": "invalid_enum_value",
              "options": [
                "asc",
                "desc"
              ],
              "path": [],
              "message": "Invalid enum value. Expected 'asc' | 'desc', received ''"
            }
          ]]
        `);
      }
    });
  });

  describe('baseModelSchema', () => {
    test('success', async () => {
      const createdAt = new Date();
      const updatedAt = new Date();

      const baseModel: BaseModel = {
        id: 'id',
        createdAt,
      };

      const baseModelWithDateAsString = {
        id: 'id',
        createdAt: createdAt.toJSON(),
      };

      const baseModelWithUpdatedAt: BaseModel = {
        id: 'id',
        createdAt,
        updatedAt,
      };

      const baseModelWithUpdatedAtWithDateAsString = {
        id: 'id',
        createdAt: createdAt.toJSON(),
        updatedAt: createdAt.toJSON(),
      };

      expect(baseModelSchema.parse(baseModel)).toEqual(baseModel);
      expect(baseModelSchema.parse(baseModelWithDateAsString)).toEqual(baseModel);
      expect(baseModelSchema.parse(baseModelWithUpdatedAt)).toEqual(baseModelWithUpdatedAt);
      expect(baseModelSchema.parse(baseModelWithUpdatedAtWithDateAsString)).toEqual(baseModelWithUpdatedAt);
    });

    test('failed', async () => {
      try {
        baseModelSchema.parse({});
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "code": "invalid_type",
              "expected": "string",
              "received": "undefined",
              "path": [
                "id"
              ],
              "message": "Required"
            },
            {
              "code": "invalid_union",
              "unionErrors": [
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "string",
                      "received": "undefined",
                      "path": [
                        "createdAt"
                      ],
                      "message": "Required"
                    }
                  ],
                  "name": "ZodError"
                },
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "number",
                      "received": "undefined",
                      "path": [
                        "createdAt"
                      ],
                      "message": "Required"
                    }
                  ],
                  "name": "ZodError"
                },
                {
                  "issues": [
                    {
                      "code": "invalid_type",
                      "expected": "date",
                      "received": "undefined",
                      "path": [
                        "createdAt"
                      ],
                      "message": "Required"
                    }
                  ],
                  "name": "ZodError"
                }
              ],
              "path": [
                "createdAt"
              ],
              "message": "Invalid input"
            }
          ]]
        `);
      }
    });
  });

  describe('baseInputModelListSchema', () => {
    test('success', async () => {
      expect(baseInputModelListSchema.parse({})).toEqual({ offset: 0, limit: 20 });
      expect(baseInputModelListSchema.parse({ offset: 1 })).toEqual({ offset: 1, limit: 20 });
      expect(baseInputModelListSchema.parse({ limit: 10 })).toEqual({ offset: 0, limit: 10 });
      expect(baseInputModelListSchema.parse({ offset: 1, limit: 10 })).toEqual({ offset: 1, limit: 10 });
    });

    test('failed', async () => {
      try {
        baseInputModelListSchema.parse({ unknown: 'unknown' });
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "code": "unrecognized_keys",
              "keys": [
                "unknown"
              ],
              "path": [],
              "message": "Unrecognized key(s) in object: 'unknown'"
            }
          ]]
        `);
      }
    });
  });
});
