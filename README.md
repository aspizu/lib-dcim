# lambda-reactor

A lightweight, type-safe API framework for AWS Lambda & API Gateway.

```bash
npm i lambda-reactor
```

## Quick Start

### Handler

```ts
// src/items.ts
import {createHandler, method, Response} from "lambda-reactor"
import {z} from "zod"

const ItemSchema = z.object({id: z.string(), label: z.string(), qty: z.number().int()})
const CreateItemSchema = ItemSchema.omit({id: true})

const store: z.infer<typeof ItemSchema>[] = []

export const handler = createHandler({
    GET: method()
        .output(z.array(ItemSchema))
        .handle(() => store),

    POST: method()
        .input(CreateItemSchema)
        .output(ItemSchema)
        .handle(({body}) => {
            const item = {id: crypto.randomUUID(), ...body}
            store.push(item)
            return Response.json(201, item)
        }),
})
```

### Health check

```ts
// src/health.ts
import {createHandler, method, Response} from "lambda-reactor"

export const handler = createHandler({
    GET: method().handle(() => Response.text(200, "OK")),
})
```

## API

### `createHandler(routes)`

Creates an AWS Lambda handler from a map of HTTP method names to route handlers.

- Returns `405 Method Not Allowed` (with an `Allow` header) for unregistered methods.
- Catches `Error` thrown during dispatch and returns `500 Internal Server Error`.
  In non-production environments the error message and stack trace are included in the body.
- Re-throws non-`Error` throwables to the Lambda runtime.

### `method()`

Returns a fluent, immutable builder for a single HTTP-method route.

| Method               | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `.use(middleware)`   | Append a middleware applied left-to-right after the callback resolves. |
| `.input(zodSchema)`  | Validate the request body. Returns `400` on failure.                   |
| `.output(zodSchema)` | Validate (and strip) the response body against a Zod schema.           |
| `.handle(callback)`  | Attach the handler callback. Returns a `RouteHandler`.                 |

The callback receives `{event, context, body}` where `body` is the parsed and validated request body.

### `Response`

Immutable response builder.

```ts
Response.text(200, "OK")
Response.json(201, {id: "abc"})
Response.json(200, data).header("X-Custom", "value")
```

### `cors(headers?)`

Middleware that injects `Access-Control-*` response headers.

```ts
import {method, cors} from "lambda-reactor"

method()
    .use(cors({"Allow-Origin": "*", "Allow-Headers": "Content-Type"}))
    .handle(…)
```

Each key is automatically prefixed with `Access-Control-`.

## CDK Integration

Use `router()` to declaratively wire handler source files to API Gateway resources.

```ts
// lib/app-stack.ts
import {router} from "lambda-reactor"
import {RestApi} from "aws-cdk-lib/aws-apigateway"
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import {Stack, type StackProps} from "aws-cdk-lib/core"
import {type Construct} from "constructs"

export class AppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)
        const api = new RestApi(this, "Api")
        router()
            .route("/health")
            .route("/items")
            .route("/users/{id}")
            .defineRestApi(
                api,
                (entry, handlerId) => new NodejsFunction(this, handlerId, {entry}),
            )
    }
}
```

`router(srcDir?)` defaults `srcDir` to `"src"`. Each `.route(path)` call expects a handler file at `<srcDir>/<path>.ts` exporting a `handler`.

Use `.cors(corsOptions)` to add preflight CORS to every resource:

```ts
router()
    .cors({allowOrigins: ["https://example.com"]})
    .route("/items")
    .defineRestApi(api, factory)
```

## Environment

Set `NODE_ENV=production` to suppress error details in `500` responses.

## Development

```sh
bun install
bun test
bun run build
```
