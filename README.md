# chubbyts-api

[![CI](https://github.com/chubbyts/chubbyts-api/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-api/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-api/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-api?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-api%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-api/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-api.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-api)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-api&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-api)

## Description

## Requirements

 * node: 18
 * [@chubbyts/chubbyts-decode-encode][2]: ^2.0.1
 * [@chubbyts/chubbyts-http-error][3]: ^3.0.1
 * [@chubbyts/chubbyts-http-types][4]: ^3.0.1
 * [@chubbyts/chubbyts-log-types][5]: ^3.0.1
 * [@chubbyts/chubbyts-negotiation][6]: ^4.0.2
 * [@chubbyts/chubbyts-throwable-to-error][7]: ^2.0.2
 * [qs][8]: ^6.14.0
 * [uuid][9]: ^11.1.0
 * [zod][10]: ^4.0.5

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-api][1].

```ts
npm i @chubbyts/chubbyts-api@^6.0.4
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
} from '@chubbyts/chubbyts-api/dist/model';
import {
  numberSchema,
  sortSchema,
  stringSchema,
  createEnrichedModelListSchema,
  createModelSchema,
  createModelListSchema,
  createEnrichedModelSchema,
} from '@chubbyts/chubbyts-api/dist/model';

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
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import type { InputMyModelListSchema, InputMyModelSchema } from './my-model.js';
import {
  enrichedMyModelListSchema,
  inputMyModelListSchema,
} from './my-model.js';
import { ResolveModelList } from '@chubbyts/chubbyts-api/dist/repository';
import { InputModelList, ModelList } from '@chubbyts/chubbyts-api/dist/model';
import { createListHandler } from '@chubbyts/chubbyts-api/dist/handler/list';

const resolveModelList: ResolveModelList<
  InputMyModelSchema,
  InputMyModelListSchema
> = (
  modelList: InputModelList<InputMyModelListSchema>,
): Promise<ModelList<InputMyModelSchema>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);
const serverRequestFactory = createServerRequestFactory();

const listHandler = createListHandler(
  inputMyModelListSchema,
  resolveModelList,
  responseFactory,
  enrichedMyModelListSchema,
  encoder,
);

(async () => {
  const request = serverRequestFactory('GET', 'http://localhost:8080/api/pets');
  const response = await listHandler(request);
})();
```

#### my-create-handler.ts

```ts
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import type { InputMyModelSchema } from './my-model.js';
import { enrichedMyModelSchema, inputMyModelSchema } from './my-model.js';
import type { PersistModel } from '@chubbyts/chubbyts-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-api/dist/model';
import { createCreateHandler } from '@chubbyts/chubbyts-api/dist/handler/create';

const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<Model<InputMyModelSchema>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const createHandler = createCreateHandler(
  decoder,
  inputMyModelSchema,
  persistModel,
  responseFactory,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const request = serverRequestFactory(
    'POST',
    'http://localhost:8080/api/pets',
  );
  const response = await createHandler(request);
})();
```

#### my-read-handler.ts

```ts
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { createResponseFactory, createServerRequestFactory }
  from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import type { InputMyModel } from './my-model.js';
import { enrichedMyModelSchema } from './my-model.js';
import type { FindModelById } from '@chubbyts/chubbyts-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-api/dist/model';
import { createReadHandler } from '@chubbyts/chubbyts-api/dist/handler/read';

const findModelById: FindModelById<InputMyModel> =
  async (id: string): Promise<Model<InputMyModel> | undefined> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const readHandler = createReadHandler<InputMyModel>(
  findModelById,
  responseFactory,
  enrichedMyModelSchema,
  encoder
);

(async () => {
  const request = serverRequestFactory(
    'GET',
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d'
  );
  const response = await readHandler(request);
})();
```

#### my-update-handler.ts

```ts
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder }
  from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import type { InputMyModelSchema } from './my-model.js';
import { enrichedMyModelSchema, inputMyModelSchema } from './my-model.js';
import type {
  FindModelById,
  PersistModel,
} from '@chubbyts/chubbyts-api/dist/repository';
import type { Model } from '@chubbyts/chubbyts-api/dist/model';
import { createUpdateHandler } from '@chubbyts/chubbyts-api/dist/handler/update';

const findModelById: FindModelById<InputMyModelSchema> = async (
  id: string,
): Promise<Model<InputMyModelSchema> | undefined> => {};
const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<Model<InputMyModelSchema>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const updateHandler = createUpdateHandler(
  findModelById,
  decoder,
  inputMyModelSchema,
  persistModel,
  responseFactory,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const request = serverRequestFactory(
    'PUT',
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
  );
  const response = await updateHandler(request);
})();
```

#### my-delete-handler.ts

```ts
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import type { InputMyModelSchema } from './my-model.js';
import {
  FindModelById,
  RemoveModel,
} from '@chubbyts/chubbyts-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-api/dist/model';
import { createDeleteHandler } from '@chubbyts/chubbyts-api/dist/handler/delete';

const findModelById: FindModelById<InputMyModelSchema> = async (
  id: string,
): Promise<Model<InputMyModelSchema> | undefined> => {};
const removeModel: RemoveModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<void> => {};
const responseFactory = createResponseFactory();

const serverRequestFactory = createServerRequestFactory();

const deleteHandler = createDeleteHandler(
  findModelById,
  removeModel,
  responseFactory,
);

(async () => {
  const request = serverRequestFactory(
    'DELETE',
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
  );
  const response = await deleteHandler(request);
})();
```

### Middleware

#### createAcceptLanguageNegotiationMiddleware

#### createAcceptNegotiationMiddleware

#### createContentTypeNegotiationMiddleware

#### createErrorMiddleware

## Copyright

2025 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-api
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-decode-encode
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-error
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-types
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-log-types
[6]: https://www.npmjs.com/package/@chubbyts/chubbyts-negotiation
[7]: https://www.npmjs.com/package/@chubbyts/chubbyts-throwable-to-error
[8]: https://www.npmjs.com/package/qs
[9]: https://www.npmjs.com/package/uuid
[10]: https://www.npmjs.com/package/zod
