# chubbyts-undici-api

[![CI](https://github.com/chubbyts/chubbyts-undici-api/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-undici-api/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-undici-api/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-undici-api?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-undici-api%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-undici-api/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-undici-api.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-undici-api)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)

## Description

A set of crud middlewares/handlers for chubbyts-undici-server.

## Requirements

 * node: 20
 * [@chubbyts/chubbyts-decode-encode][2]: ^2.1.1
 * [@chubbyts/chubbyts-http-error][3]: ^3.0.1
 * [@chubbyts/chubbyts-log-types][4]: ^3.0.1
 * [@chubbyts/chubbyts-negotiation][5]: ^4.0.2
 * [@chubbyts/chubbyts-throwable-to-error][6]: ^2.0.2
 * [@chubbyts/chubbyts-undici-server][7]: ^1.0.1
 * [qs][8]: ^6.14.0
 * [uuid][9]: ^13.0.0
 * [zod][10]: ^4.2.1

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-undici-api][1].

```ts
npm i @chubbyts/chubbyts-undici-api@^1.1.1
```

## Usage

### Handler

#### my-model.ts

```ts
import { z } from 'zod';
import type {
  EnrichedModel,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichedModelSchema,
  InputModel,
  InputModelList,
  Model,
  ModelList,
  ModelListSchema,
  ModelSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';
import {
  numberSchema,
  sortSchema,
  stringSchema,
  createEnrichedModelListSchema,
  createModelSchema,
  createModelListSchema,
  createEnrichedModelSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';

export const inputMyModelSchema = z
  .object({ name: stringSchema, value: stringSchema })
  .strict();

export type InputMyModelSchema = typeof inputMyModelSchema;

export type InputMyModel = InputModel<InputMyModelSchema>;

export const inputMyModelListSchema = z
  .object({
    offset: numberSchema.default(0),
    limit: numberSchema.default(20),
    filters: z.object({ name: stringSchema.optional() }).strict().default({}),
    sort: z.object({ name: sortSchema }).strict().default({}),
  })
  .strict();

export type InputMyModelListSchema = typeof inputMyModelListSchema;

export type InputMyModelList = InputModelList<InputMyModelListSchema>;

export type MyModelSchema = ModelSchema<InputMyModelSchema>;

export const myModelSchema: MyModelSchema =
  createModelSchema(inputMyModelSchema);

export type MyModel = Model<InputMyModelSchema>;

export type MyModelListSchema = ModelListSchema<
  InputMyModelSchema,
  InputMyModelListSchema
>;

export const myModelListSchema: MyModelListSchema = createModelListSchema(
  inputMyModelSchema,
  inputMyModelListSchema,
);

export type MyModelList = ModelList<InputMyModelSchema, InputMyModelListSchema>;

export type EnrichedMyModelSchema = EnrichedModelSchema<InputMyModelSchema>;

export const enrichedMyModelSchema: EnrichedMyModelSchema =
  createEnrichedModelSchema(inputMyModelSchema);

export type EnrichedMyModel = EnrichedModel<InputMyModelSchema>;

export type EnrichedMyModelListSchema = EnrichedModelListSchema<
  InputMyModelSchema,
  InputMyModelListSchema
>;

export const enrichedMyModelListSchema: EnrichedMyModelListSchema =
  createEnrichedModelListSchema(inputMyModelSchema, inputMyModelListSchema);

export type EnrichedMyModelList = EnrichedModelList<
  InputMyModelSchema,
  InputMyModelListSchema
>;
```

#### my-list-handler.ts

```ts
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import type { InputMyModelListSchema, InputMyModelSchema } from './my-model.js';
import {
  enrichedMyModelListSchema,
  inputMyModelListSchema,
} from './my-model.js';
import { ResolveModelList } from '@chubbyts/chubbyts-undici-api/dist/repository';
import { InputModelList, ModelList } from '@chubbyts/chubbyts-undici-api/dist/model';
import { createListHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/list';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const resolveModelList: ResolveModelList<
  InputMyModelSchema,
  InputMyModelListSchema
> = (
  modelList: InputModelList<InputMyModelListSchema>,
): Promise<ModelList<InputMyModelSchema>> => {};
const encoder = createEncoder([createJsonTypeEncoder()]);

const listHandler = createListHandler(
  inputMyModelListSchema,
  resolveModelList,
  enrichedMyModelListSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest('http://localhost:8080/api/pets', {method: 'GET'});
  const response = await listHandler(serverRequest);
})();
```

#### my-create-handler.ts

```ts
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import { createJsonTypeDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import type { InputMyModelSchema } from './my-model.js';
import { enrichedMyModelSchema, inputMyModelSchema } from './my-model.js';
import type { PersistModel } from '@chubbyts/chubbyts-undici-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-undici-api/dist/model';
import { createCreateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/create';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<Model<InputMyModelSchema>> => {};
const encoder = createEncoder([createJsonTypeEncoder()]);

const createHandler = createCreateHandler(
  decoder,
  inputMyModelSchema,
  persistModel,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest('http://localhost:8080/api/pets', {method: 'POST'});
  const response = await createHandler(serverRequest);
})();
```

#### my-read-handler.ts

```ts
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import type { InputMyModel } from './my-model.js';
import { enrichedMyModelSchema } from './my-model.js';
import type { FindModelById } from '@chubbyts/chubbyts-undici-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-undici-api/dist/model';
import { createReadHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/read';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const findModelById: FindModelById<InputMyModel> =
  async (id: string): Promise<Model<InputMyModel> | undefined> => {};
const encoder = createEncoder([createJsonTypeEncoder()]);

const readHandler = createReadHandler<InputMyModel>(
  findModelById,
  enrichedMyModelSchema,
  encoder
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'GET' }
  );
  const response = await readHandler(serverRequest);
})();
```

#### my-update-handler.ts

```ts
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import { createJsonTypeDecoder }
  from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import type { InputMyModelSchema } from './my-model.js';
import { enrichedMyModelSchema, inputMyModelSchema } from './my-model.js';
import type {
  FindModelById,
  PersistModel,
} from '@chubbyts/chubbyts-undici-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-undici-api/dist/model';
import { createUpdateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/update';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const findModelById: FindModelById<InputMyModelSchema> = async (
  id: string,
): Promise<Model<InputMyModelSchema> | undefined> => {};
const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<Model<InputMyModelSchema>> => {};
const encoder = createEncoder([createJsonTypeEncoder()]);

const updateHandler = createUpdateHandler(
  findModelById,
  decoder,
  inputMyModelSchema,
  persistModel,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'PUT' }
  );
  const response = await updateHandler(serverRequest);
})();
```

#### my-delete-handler.ts

```ts
import type { InputMyModelSchema } from './my-model.js';
import {
  FindModelById,
  RemoveModel,
} from '@chubbyts/chubbyts-undici-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-undici-api/dist/model';
import { createDeleteHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/delete';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const findModelById: FindModelById<InputMyModelSchema> = async (
  id: string,
): Promise<Model<InputMyModelSchema> | undefined> => {};
const removeModel: RemoveModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<void> => {};

const deleteHandler = createDeleteHandler(
  findModelById,
  removeModel,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'DELETE' }
  );
  const response = await deleteHandler(serverRequest);
})();
```

#### my-typed-handler.ts

See [typed][20] if you want/need more flexibility and prefer a typed generic handler?

### Middleware

#### createAcceptLanguageNegotiationMiddleware

#### createAcceptNegotiationMiddleware

#### createContentTypeNegotiationMiddleware

#### createErrorMiddleware

## Copyright

2025 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-api
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-decode-encode
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-error
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-log-types
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-negotiation
[6]: https://www.npmjs.com/package/@chubbyts/chubbyts-throwable-to-error
[7]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[8]: https://www.npmjs.com/package/qs
[9]: https://www.npmjs.com/package/uuid
[10]: https://www.npmjs.com/package/zod


[20]: doc/handler/typed.md
