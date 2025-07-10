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
 * [zod][10]: ^3.25.76

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-api][1].

```ts
npm i @chubbyts/chubbyts-api@^5.2.0
```

## Usage

### Handler

```ts
import { baseModelSchema, baseInputModelListSchema, sortSchema, stringSchema } from '@chubbyts/chubbyts-api/dist/model';

export const inputModelSchema = z.object({ name: stringSchema }).strict();

export type InputModel = z.infer<typeof inputModelSchema>;

export const enrichedModelSchema = z.object({
  ...baseModelSchema.shape,
  ...inputModelSchema.shape,
}).strict();

export const inputModelListSchema = z.object({
  ...baseInputModelListSchema.shape,
  filters: z.object({ name: stringSchema.optional() }).optional();
  sort: z.object({ name: sortSchema.optional() }).optional();
}).strict();

const enrichedModelListSchema = z.object({
  ...inputModelListSchema.shape,
  items: z.array(enrichedModelSchema),
  count: z.number(),
}).strict();
```

#### createListHandler

```ts
import { createListHandler } from '@chubbyts/chubbyts-api/dist/handler/list';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { z } from 'zod';
import { ResolveModelList } from '@chubbyts/chubbyts-api/dist/repository';
import { List, Model } from '@chubbyts/chubbyts-api/dist/model';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import { enrichedModelListSchema, inputModelListSchema, InputModel } from './model.ts';

const resolveModelList: ResolveModelList<InputModel> = (list: List<InputModel>): Promise<List<InputModel>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);
const serverRequestFactory = createServerRequestFactory();

const listHandler = createListHandler<InputModel>(
  inputModelListSchema,
  resolveModelList,
  responseFactory,
  enrichedModelListSchema,
  encoder
);

(async () => {
  const request = serverRequestFactory('GET', 'http://localhost:8080/api/pets');
  const response = await listHandler(request);
})();
```

#### createCreateHandler

```ts
import { createCreateHandler } from '@chubbyts/chubbyts-api/dist/handler/create';
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { z } from 'zod';
import { PersistModel } from '@chubbyts/chubbyts-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-api/dist/model';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import { enrichedModelSchema, inputModelSchema, InputModel } from './model.ts';

const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputModel> = (model: Model<InputModel>): Promise<Model<InputModel>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const createHandler = createCreateHandler<Model>(
  decoder,
  inputModelSchema,
  persistModel,
  responseFactory,
  enrichedModelSchema,
  encoder
);

(async () => {
  const request = serverRequestFactory('POST', 'http://localhost:8080/api/pets');
  const response = await createHandler(request);
})();
```

#### createReadHandler

```ts
import { createReadHandler } from '@chubbyts/chubbyts-api/dist/handler/read';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { z } from 'zod';
import { FindModelById } from '@chubbyts/chubbyts-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-api/dist/model';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import { enrichedModelSchema, InputModel } from './model.ts';

const findModelById: FindModelById<InputModel> = async (id: string): Promise<Model<InputModel>|undefined> => {};
const responseFactory = createResponseFactory();
const enrichedModelSchema = z.object({ id: z.string(), createdAt: z.date(), name: z.string() }).strict();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const readHandler = createReadHandler<Model>(
  findModelById,
  responseFactory,
  enrichedModelSchema,
  encoder
);

(async () => {
  const request = serverRequestFactory('GET', 'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d');
  const response = await readHandler(request);
})();
```

#### createUpdateHandler

```ts
import { createUpdateHandler } from '@chubbyts/chubbyts-api/dist/handler/update';
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { z } from 'zod';
import { FindModelById, PersistModel } from '@chubbyts/chubbyts-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-api/dist/model';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import { enrichedModelSchema, inputModelSchema, InputModel } from './model.ts';

const findModelById: FindModelById<InputModel> = async (id: string): Promise<Model<InputModel>|undefined> => {};
const decoder = createDecoder([createJsonTypeDecoder()]);
const persistModel: PersistModel<InputModel> = (model: Model<InputModel>): Promise<Model<InputModel>> => {};
const responseFactory = createResponseFactory();
const encoder = createEncoder([createJsonTypeEncoder()]);

const serverRequestFactory = createServerRequestFactory();

const updateHandler = createUpdateHandler<Model>(
  findModelById,
  decoder,
  inputModelSchema,
  persistModel,
  responseFactory,
  enrichedModelSchema,
  encoder
);

(async () => {
  const request = serverRequestFactory('PUT', 'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d');
  const response = await updateHandler(request);
})();
```

#### createDeleteHandler

```ts
import { createDeleteHandler } from '@chubbyts/chubbyts-api/dist/handler/delete';
import { FindModelById, RemoveModel } from '@chubbyts/chubbyts-api/dist/repository';
import { Model } from '@chubbyts/chubbyts-api/dist/model';
import {
  createResponseFactory,
  createServerRequestFactory,
} from '@chubbyts/chubbyts-http/dist/message-factory'; // any implementation can be used
import { InputModel } from './model.ts';

const findModelById: FindModelById<InputModel> = async (id: string): Promise<Model<InputModel>|undefined> => {};
const removeModel: RemoveModel<InputModel> = (model: Model<InputModel>): Promise<void> => {};
const responseFactory = createResponseFactory();

const serverRequestFactory = createServerRequestFactory();

const deleteHandler = createDeleteHandler<Model>(
  findModelById,
  removeModel,
  responseFactory,
);

(async () => {
  const request = serverRequestFactory('DELETE', 'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d');
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
