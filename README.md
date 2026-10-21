# The Customizable Coffee Shop — Backend

Ordering engine for a highly customizable coffee shop. A customer picks a **base**
(Coffee, Tea, Milk), stacks **any number of syrups and toppings** (duplicates
allowed, e.g. a double vanilla), chooses exactly **one size**, and places an
order of one or more drinks. The system returns a human‑readable description of
each drink, an itemised price breakdown, and a receipt with a grand total.

This repository holds the API and the design write‑up. The web UI lives in its
own repository,
[coffee-shop-frontend](https://github.com/nNottp33/coffee-shop-frontend).

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Backend  | NestJS 11 + TypeScript                            |
| Database | PostgreSQL 17 + TypeORM 0.3 (migrations, no sync) |
| Frontend | React 19 + TypeScript + Vite (separate repo)      |
| Tooling  | pnpm, Node 24, ESLint + Prettier, Jest            |
| Runtime  | Docker (node:24‑alpine) + docker compose          |

---

## 1. Quick start

### With Docker (recommended)

```bash
docker compose up --build
```

| Service      | URL                            |
| ------------ | ------------------------------ |
| REST API     | http://localhost:3000/api      |
| Swagger docs | http://localhost:3000/api/docs |
| PostgreSQL   | localhost:5432 (coffee/coffee) |

The backend container runs pending TypeORM migrations on start (schema +
menu seed), then boots the API.

Both containers join a Docker network named `coffee-shop`. The frontend
repository's compose file joins the same network and reverse‑proxies `/api` to
this API, so start this stack first and the frontend second.

Ports and credentials can be overridden by copying `.env.example` to `.env`.
If port 5432 or 3000 is already taken on the host, change `DB_PORT` or
`API_PORT` there.

### Local development (without Docker)

Requires Node 24 and pnpm 10 (`corepack enable pnpm` installs the version pinned
in `package.json`).

```bash
# 0. install once
pnpm install

# 1. a Postgres on localhost:5432 with user/password/db = coffee/coffee/coffee_shop
#    e.g.  docker compose up db

# 2. the API
cp .env.example .env
pnpm migration:run         # creates the schema and seeds the menu
pnpm start:dev             # http://localhost:3000/api  (Swagger: /api/docs)
```

Other scripts: `pnpm build`, `pnpm lint` (ESLint + Prettier, fixes what it
can), `pnpm format`, `pnpm start:debug`,
`pnpm migration:generate src/common/database/migrations/AddHazelnut`.

`pnpm install` also installs a Husky pre‑commit hook that runs the unit tests
and lint‑staged (Prettier + ESLint on the staged `.ts` files).

The API and the migration commands both read `.env`. Variables that are already
set in the process environment win over the file.

### Configuration

| Variable                           | API outside Docker  | docker compose         |
| ---------------------------------- | ------------------- | ---------------------- |
| `PORT`                             | port the API binds  | fixed to 3000 inside   |
| `API_PORT`                         | not used            | host port for the API  |
| `DB_HOST`                          | database host       | fixed to `db` inside   |
| `DB_PORT`                          | database port       | host port for Postgres |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | database login      | same values            |
| `DB_LOGGING`                       | `true` logs SQL     | not passed             |
| `CORS_ORIGIN`                      | comma‑separated list | same value            |

### Tests

```bash
pnpm test        # unit tests (Jest), database mocked
pnpm test:e2e    # end-to-end tests, needs the Postgres from step 1 above
```

Unit tests cover the pattern classes (decorators, builder, invariants), the
order totals, the `DrinksService` (quote, domain errors as 400), the
`OrdersService` (place order, stored receipt, list, 404), the `CatalogService`
(catalog grouping and prices, 404 on unknown ids), the `ExceptionService`
(error mapping) and the drinks and orders controllers over HTTP (`limit`
handling, status codes), all with the database mocked.

The end‑to‑end tests in `test/` boot the whole application against a real
database, apply pending migrations, and walk through the assignment: the menu,
the quote for `"Large Coffee, Vanilla, Vanilla, Whipped Cream"`, an order of two
drinks with its receipt and grand total, and the error cases. The order they
create is deleted afterwards.

---

## 2. Architecture

```
┌──────────────────────┐        HTTP/JSON         ┌──────────────────────────────────────┐
│  React SPA (Vite)    │ ───────────────────────▶ │  NestJS API  (/api)                  │
│  - DrinkBuilder      │  GET  /catalog           │                                      │
│  - live quote        │  POST /drinks/quote      │  Catalog · Drinks · Orders modules   │
│  - Cart / Receipt    │  POST /orders            │      │                │              │
└──────────────────────┘  GET  /orders[/:id]      │      ▼                ▼              │
                                                  │  ┌────────────────────────────────┐  │
                                                  │  │  Pure classes (no framework)   │  │
                                                  │  │  IBeverage · BaseDrink         │  │
                                                  │  │  IngredientDecorator           │  │
                                                  │  │  SizeDecorator · DrinkBuilder  │  │
                                                  │  │  Order · OrderLine             │  │
                                                  │  └────────────────────────────────┘  │
                                                  │      │ TypeORM entities + migrations │
                                                  └──────┼───────────────────────────────┘
                                                         ▼
                                                  ┌──────────────┐
                                                  │  PostgreSQL  │
                                                  └──────────────┘
```

The code is organised by feature, with three kinds of code inside:

1. **Pure classes** — framework‑free TypeScript that knows nothing about HTTP or
   the database. The Decorator + Builder pattern lives in
   `src/drinks/beverage`, and the order totals in
   `src/orders/order.ts`. The pricing and description rules for a new drink
   are computed here, and the classes are unit‑tested in isolation. Stored
   receipts are rebuilt from their snapshots in `OrdersService`.
2. **Feature modules** (`src/catalog`, `src/drinks`,
   `src/orders`) — NestJS modules, services and controllers. They load
   catalog rows, hand immutable value objects to the pure classes, and persist
   the resulting order. Request classes live in `input/`, response classes in
   `models/`, internal shapes in `<feature>.interface.ts`.
3. **Infrastructure** (`src/common`) — environment config, the database
   module with TypeORM entities and SQL migrations, the request decorators and
   the exception layer. `CommonModule` bundles them and every feature module
   imports it. The schema is owned by migrations (`synchronize: false`), and
   the menu itself is seed data.

Shared constants and pure helpers that every feature may use (the enums, the
error catalogue `messageError`, the response base class, the minor‑to‑major
money conversion) live in `src/utils`.

Every service method that answers a request follows the same shape: it takes
the request id first, does its work inside `try`, returns
`{ status, code, message, result }`, and hands anything it catches to
`ExceptionService`, which logs it once with the request id and body and answers
with `{ status, code, message }`.

### Class diagram

```
                 «interface»
                  IBeverage
     ┌────────────────────────────────┐
     │ + describe(): string           │
     │ + cost(): Minor                │
     │ + breakdown(): IPriceLine[]    │
     └───────────────▲────────────────┘
                     │ implements
     ┌───────────────┼──────────────────────────────┐
     │               │                              │
┌────┴──────────┐ ┌──┴──────────────────────┐ ┌─────┴─────────────────┐
│  BaseDrink    │ │  IngredientDecorator    │ │  SizeDecorator        │
│───────────────│ │─────────────────────────│ │───────────────────────│
│ - base:       │ │ - inner: IBeverage  ◆───┼─┼─▶ wraps any IBeverage │
│   IIngredient │ │ - ingredient:           │ │ - inner: IBeverage    │
│               │ │   IIngredient (data)    │ │ - size: ISize (data)  │
└───────────────┘ └─────────────────────────┘ └───────────────────────┘

┌──────────────────────┐   ┌───────────────────┐   ┌──────────────────────┐
│ «value» IIngredient  │   │ «value» ISize     │   │  DrinkBuilder        │
│──────────────────────│   │───────────────────│   │──────────────────────│
│ id, code, name       │   │ id, code, name    │   │ + withBase(i)        │
│ category: base|syrup │   │ surcharge: Minor  │   │ + add(i)  (repeat!)  │
│           |topping   │   └───────────────────┘   │ + withSize(s)        │
│ price: Minor         │                           │ + build(): IBeverage │
└──────────────────────┘                           └──────────────────────┘

┌──────────────────────┐   ┌──────────────────────────┐
│  Order               │◆──│  OrderLine               │
│──────────────────────│   │──────────────────────────│
│ lines: OrderLine[]   │   │ beverage: IBeverage      │
│ grandTotal: Minor    │   │ quantity, unitPrice,     │
└──────────────────────┘   │ lineTotal, description   │
                           └──────────────────────────┘
```

A finished drink is the chain

```
SizeDecorator( IngredientDecorator( IngredientDecorator( BaseDrink(Coffee), Vanilla ), Vanilla ), Large )
```

and each layer contributes one segment of the description and one line of the
price breakdown, so `describe()` yields
`"Large Coffee, Vanilla, Vanilla"` and `cost()` yields
`5000 + 1000 + 1000 + 2000` in minor units, which is ฿90.00.

### Database schema

```
ingredients            sizes                orders
────────────           ─────────────        ──────────────────
id (uuid)              id (uuid)            id (uuid)
code (unique)          code (unique)        order_number (serial)
name                   name                 customer_name
category (enum)        surcharge_minor      grand_total_minor
price_minor            is_active            created_at
is_active, sort_order  sort_order                 │
                                                  │ 1..*
order_items ◀─────────────────────────────────────┘
────────────────────────────────
id, order_id, position
base_ingredient_id (FK)  + base_name_snapshot / base_price_minor_snapshot
size_id (FK)             + size_name_snapshot / size_surcharge_minor_snapshot
description, quantity, unit_price_minor, line_total_minor
      │ 1..*
order_item_ingredients ◀───────
────────────────────────────────
id, order_item_id, ingredient_id (FK), position,
name_snapshot, price_minor_snapshot        ← one row per occurrence → duplicates are natural
```

Prices are stored as **integers in minor units** (satang) and only converted to
decimals at the API boundary, avoiding floating‑point drift. Every order item
snapshots the names and prices it was charged with, so changing the menu later
never rewrites historical receipts.

---

## 3. Language choice: TypeScript everywhere

- **One language, one type system, front to back.** The `DrinkSpecInput`,
  `ReceiptResult` and catalog classes here have the same shape as the
  `DrinkSpec`, `Receipt` and `Catalog` types in the frontend repository, and
  the NestJS input and model classes generate the Swagger/OpenAPI contract that
  the React client codes against.
- **Interfaces + structural typing** make the Decorator pattern almost free:
  `IBeverage` is an interface, and any object with `describe/cost/breakdown` is a
  valid layer — no abstract base class ceremony.
- **Data‑driven design fits TypeScript well.** Ingredients are plain readonly
  value objects, so the whole menu can live in the database and flow through the
  pattern classes untouched.
- **NestJS** gives dependency injection, validation pipes, and module boundaries
  that map neatly onto the pure classes / feature modules / infrastructure split
  above, while **TypeORM migrations** keep the schema versioned in the repo.
- It is also the stack recommended by the assignment, which keeps the review
  focused on the design rather than on tooling.

---

## 4. Design approach: Decorator + Builder over a data‑driven catalog

The naive approach to "Coffee with vanilla and whipped cream in a large cup" is
a subclass per combination (`LargeVanillaWhipCoffee`). With 3 bases × 3 syrups ×
3 toppings × 3 sizes *and duplicates allowed*, the number of classes is
unbounded. The design here avoids that in two steps.

### 4.1 Decorator pattern — one class per *kind* of layer, not per ingredient

`IBeverage` is the component interface. `BaseDrink` is the only concrete
component. `IngredientDecorator` is the only decorator for extras, and
`SizeDecorator` the only decorator for size. Each is **parameterised by a value
object** (`IIngredient` / `ISize`) rather than hard‑coding "Vanilla":

```ts
// src/drinks/beverage/ingredient-decorator.ts
export class IngredientDecorator implements IBeverage {
  constructor(
    private readonly inner: IBeverage,
    private readonly ingredient: IIngredient
  ) {
    if (ingredient.category === IngredientCategoryEnum.BASE) {
      throw new DomainError(
        `"${ingredient.name}" is a base drink and cannot be added as an extra`
      )
    }
  }

  describe(): string {
    return `${this.inner.describe()}, ${this.ingredient.name}`
  }

  cost(): Minor {
    return this.inner.cost() + this.ingredient.price
  }

  breakdown(): IPriceLine[] {
    return [
      ...this.inner.breakdown(),
      { label: this.ingredient.name, amount: this.ingredient.price }
    ]
  }
}
```

That gives us **three classes total** for an unlimited menu. A new syrup
("Hazelnut") is a new database row, not a new class. A double vanilla is the same
decorator applied twice, and because each layer appends to the description and
breakdown in order, the receipt naturally reads `"…, Vanilla, Vanilla"`.

### 4.2 Builder — assembling the chain safely

Constructing nested decorators by hand is error‑prone (forgetting the size,
wrapping the size before an extra). `DrinkBuilder` owns the assembly and enforces
the invariants: exactly one base, exactly one size, extras in the order they were
added, size applied outermost so it prefixes the description.

```ts
// src/drinks/beverage/drink-builder.ts
build(): IBeverage {
  if (!this.base) {
    throw new DomainError('A drink needs a base')
  }
  if (!this.size) {
    throw new DomainError('A drink needs exactly one size')
  }

  let beverage: IBeverage = new BaseDrink(this.base)
  for (const extra of this.extras) {
    beverage = new IngredientDecorator(beverage, extra)
  }

  return new SizeDecorator(beverage, this.size)
}
```

### 4.3 Code snippets: building and customising a drink

```ts
import { IIngredient, ISize } from '@/catalog/catalog.interface'
import { DrinkBuilder } from '@/drinks/beverage'
import { Order, OrderLine } from '@/orders/order'
import { IngredientCategoryEnum } from '@/utils/constants/catalog.enum'

// value objects normally come from the catalog table; shown inline for clarity
const coffee: IIngredient = {
  id: '…',
  code: 'COFFEE',
  name: 'Coffee',
  category: IngredientCategoryEnum.BASE,
  price: 5000
}
const vanilla: IIngredient = {
  id: '…',
  code: 'VANILLA',
  name: 'Vanilla',
  category: IngredientCategoryEnum.SYRUP,
  price: 1000
}
const whip: IIngredient = {
  id: '…',
  code: 'WHIPPED_CREAM',
  name: 'Whipped Cream',
  category: IngredientCategoryEnum.TOPPING,
  price: 1500
}
const large: ISize = { id: '…', code: 'L', name: 'Large', surcharge: 2000 }

// 1. a plain base drink
const plain = DrinkBuilder.create().withBase(coffee).withSize(large).build()
plain.describe() // "Large Coffee"
plain.cost() // 7000  (฿70.00)

// 2. customise it with multiple ingredients, including a duplicate
const fancy = DrinkBuilder.create()
  .withBase(coffee)
  .add(vanilla)
  .add(vanilla) // double vanilla
  .add(whip)
  .withSize(large)
  .build()

fancy.describe() // "Large Coffee, Vanilla, Vanilla, Whipped Cream"
fancy.cost() // 10500 (฿105.00)
fancy.breakdown() // [Coffee 5000, Vanilla 1000, Vanilla 1000, Whipped Cream 1500, Size: Large 2000]

// 3. an order with a receipt
const order = new Order([new OrderLine(fancy, 2), new OrderLine(plain, 1)])
order.grandTotal // 10500*2 + 7000 = 28000 (฿280.00)
```

The same flow over HTTP:

```bash
# quote a drink (no persistence)
curl -X POST localhost:3000/api/drinks/quote -H 'content-type: application/json' \
  -d '{"base_id":"<coffee>","size_id":"<large>","ingredient_ids":["<vanilla>","<vanilla>","<whip>"]}'
# → {"status":200,"code":"SUCCESSFULLY","message":"get drink quote successfully",
#    "result":{"description":"Large Coffee, Vanilla, Vanilla, Whipped Cream","unit_price":105,"breakdown":[…]}}

# place an order
curl -X POST localhost:3000/api/orders -H 'content-type: application/json' \
  -d '{"customer_name":"Nat","items":[{"base_id":"<coffee>","size_id":"<large>","ingredient_ids":["<vanilla>","<vanilla>","<whip>"],"quantity":2},{"base_id":"<tea>","size_id":"<small>"}]}'
# → {"status":201,"code":"SUCCESSFULLY","message":"create order number 1 successfully",
#    "result":{"order_number":1,"grand_total":250,"items":[{…"line_total":210},{…"line_total":40}],…}}
```

### 4.4 Pricing rules

The assignment leaves the concrete numbers open, so the seed uses:

| Bases              | Syrups                              | Toppings                                       | Sizes                     |
| ------------------ | ----------------------------------- | ---------------------------------------------- | ------------------------- |
| Coffee ฿50         | Vanilla ฿10                         | Whipped Cream ฿15                              | Small +฿0                 |
| Tea ฿40            | Caramel ฿10                         | Cinnamon ฿5                                    | Medium +฿10               |
| Milk ฿35           | Chocolate ฿15                       | Marshmallows ฿12                               | Large +฿20                |

`price = base + Σ(each extra, counted per occurrence) + size surcharge`.
All numbers live in the `ingredients` / `sizes` tables and can be changed with a
migration or an admin update — the code never hard‑codes a price.

---

## 5. Why this design is maintainable and extensible

- **No class explosion.** Three classes describe every possible drink.
  Combinations, and duplicates in particular, are handled by composition at
  runtime instead of by the type hierarchy.
- **Open/Closed.** Adding ingredients, bases or sizes is data. Adding a *new
  kind* of layer (say a "Decaf" modifier with a negative price, or a loyalty
  discount) is a new small decorator that implements `IBeverage`; nothing
  existing changes.
- **Single responsibility per layer.** Each decorator knows only its own name and
  price and delegates the rest inward, so description and pricing logic never
  drift apart — they are computed by the same object graph.
- **Pure, testable core.** The pattern classes and the order classes import no
  framework or database code, only interfaces, the category enum and the error
  class. The unit tests construct value objects inline and assert descriptions,
  totals and invariants in milliseconds.
- **Safe evolution of prices.** Orders snapshot names and prices at purchase time
  and store money as integers, so re‑pricing the menu never corrupts history and
  totals are exact.
- **Explicit boundaries.** Controllers validate input (class‑validator input
  classes), the exception service translates domain errors to HTTP 400 and
  unexpected ones to a 500 that hides the cause, the catalog service resolves
  ids to value objects, and the pure classes do the arithmetic. Each part can
  change independently.
- **One error catalogue.** Every business error is an entry in `messageError`
  with a stable `code`, so a client can branch on the code instead of parsing
  the message.
- **Versioned schema.** TypeORM migrations
  (`src/common/database/migrations`) are the single source of truth for
  the database, run automatically in Docker and reviewable in git.

---

## 6. API summary

| Method | Path                | Purpose                                        |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/api/catalog`      | Active bases, syrups, toppings and sizes       |
| POST   | `/api/drinks/quote` | Describe + price one drink (no persistence)    |
| POST   | `/api/orders`       | Place an order (1..n drinks), returns receipt  |
| GET    | `/api/orders`       | Recent receipts, newest first (`?limit=`)      |
| GET    | `/api/orders/:id`   | One receipt                                    |
| GET    | `/api/health`       | Liveness + DB check                            |
| GET    | `/api/docs`         | Swagger UI                                     |

Field names in requests and responses are `snake_case`. Every endpoint except
`/api/health` and `/api/docs` answers with the same envelope, and the payload is
in `result`:

```json
{ "status": 200, "code": "SUCCESSFULLY", "message": "get catalog successfully", "result": {} }
```

Errors raised by the application carry a stable `code`:

```json
{ "status": 404, "code": "INGREDIENT_NOT_FOUND", "message": "Unknown ingredient id(s): …" }
```

| Case                                              | HTTP  | `code`                  |
| ------------------------------------------------- | ----- | ----------------------- |
| Unknown ingredient id                             | `404` | `INGREDIENT_NOT_FOUND`  |
| Unknown size id                                   | `404` | `SIZE_NOT_FOUND`        |
| Unknown order id                                  | `404` | `ORDER_NOT_FOUND`       |
| `limit` is not a number                           | `400` | `LIMIT_INVALID`         |
| Domain invariant broken (e.g. a syrup as a base)  | `400` | `BAD_REQUEST`           |
| Anything unexpected                               | `500` | `INTERNAL_SERVER_ERROR` |

Input that fails validation (a missing `size_id`, an id that is not a UUID, an
empty `items`) is rejected by the validation pipe before it reaches a service
and answers `400` with NestJS's own body,
`{ "message": ["…"], "error": "Bad Request", "statusCode": 400 }`.

A quote answers `200` and a placed order `201`. `limit` defaults to 50, drops
any fraction and is clamped to 1–200. Ids are matched without regard to letter
case. A client may send an `x-api-request-id` header, and the API writes it
next to every error it logs.

---

## 7. Project layout

```
.
├── package.json / pnpm-lock.yaml
├── docker-compose.yml       db + backend on the coffee-shop network
├── Dockerfile               node:24-alpine multi-stage (builder, runner), prod deps only
├── docker-entrypoint.sh     runs migrations, then starts the API
├── .husky/                  pre-commit hook: unit tests + lint-staged
├── test/                    end-to-end tests (real database)
└── src/
    ├── main.ts              bootstrap: prefix, CORS, validation, Swagger
    ├── app.module.ts        CommonModule + feature modules
    ├── app.controller.ts    GET /api/health
    ├── catalog/             ingredients & sizes: module, controller, service (+ spec)
    │   └── models/          response classes
    ├── drinks/              quote a drink: module, controller, service (+ specs)
    │   ├── beverage/        Decorator + Builder: BaseDrink, decorators, DrinkBuilder (+ spec)
    │   ├── input/           request classes (validated)
    │   └── models/          response classes
    ├── orders/              place order / receipts, Order + OrderLine (+ specs)
    │   ├── input/           request classes (validated)
    │   └── models/          response classes
    ├── common/              infrastructure, wired by common.module.ts
    │   ├── environment/     typed env config (app, db)
    │   ├── database/        database module, CLI data source
    │   │   ├── entity/      TypeORM entities + per-entity feature modules
    │   │   └── migrations/  schema + menu seed
    │   ├── decorators/      @RequestId()
    │   └── exception/       ExceptionService (+ spec), DomainError
    └── utils/               helpers without dependency injection
        ├── constants/       enums, messageError, DefaultResponse
        └── functions/       pure functions
```

Conventions:

- A file imports from its own folder and its sub‑folders with `./`, and from
  anywhere else with the `@/` alias. No import climbs with `../`.
- Request classes end in `Input`, payload classes in `Result`, envelope classes
  in `Response` (they extend `DefaultResponse`), interfaces start with `I`,
  enums end in `Enum`.
- Data fields are `snake_case` from the database column to the JSON body.
  Variables, methods and the getters of the pure classes are `camelCase`.
- Table names come from `TableEnum`, error definitions from `messageError`.
- Folders that only group classes of one kind (`input/`, `models/`) expose them
  through an `index.ts` barrel.
- Prettier formats the code with single quotes, no semicolons and no trailing
  commas.
