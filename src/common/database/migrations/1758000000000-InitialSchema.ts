import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1758000000000 implements MigrationInterface {
  name = 'InitialSchema1758000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
    await queryRunner.query(
      `CREATE TYPE "ingredient_category" AS ENUM ('base', 'syrup', 'topping')`
    )

    await queryRunner.query(`
      CREATE TABLE "ingredients" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code"        varchar(64)  NOT NULL,
        "name"        varchar(128) NOT NULL,
        "category"    "ingredient_category" NOT NULL,
        "price_minor" integer      NOT NULL CHECK ("price_minor" >= 0),
        "is_active"   boolean      NOT NULL DEFAULT true,
        "sort_order"  integer      NOT NULL DEFAULT 0,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_ingredients_code" UNIQUE ("code")
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_ingredients_category_active" ON "ingredients" ("category", "is_active")`
    )

    await queryRunner.query(`
      CREATE TABLE "sizes" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code"            varchar(32) NOT NULL,
        "name"            varchar(64) NOT NULL,
        "surcharge_minor" integer     NOT NULL DEFAULT 0 CHECK ("surcharge_minor" >= 0),
        "is_active"       boolean     NOT NULL DEFAULT true,
        "sort_order"      integer     NOT NULL DEFAULT 0,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_sizes_code" UNIQUE ("code")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_number"      serial       NOT NULL,
        "customer_name"     varchar(128),
        "grand_total_minor" integer      NOT NULL CHECK ("grand_total_minor" >= 0),
        "created_at"        timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id"           uuid         NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "position"           integer      NOT NULL,
        "base_ingredient_id" uuid         NOT NULL REFERENCES "ingredients"("id") ON DELETE RESTRICT,
        "size_id"            uuid         NOT NULL REFERENCES "sizes"("id") ON DELETE RESTRICT,
        "base_name_snapshot"          varchar(128) NOT NULL,
        "base_price_minor_snapshot"   integer      NOT NULL CHECK ("base_price_minor_snapshot" >= 0),
        "size_name_snapshot"          varchar(64)  NOT NULL,
        "size_surcharge_minor_snapshot" integer    NOT NULL CHECK ("size_surcharge_minor_snapshot" >= 0),
        "description"        varchar(512) NOT NULL,
        "quantity"           integer      NOT NULL CHECK ("quantity" > 0),
        "unit_price_minor"   integer      NOT NULL CHECK ("unit_price_minor" >= 0),
        "line_total_minor"   integer      NOT NULL CHECK ("line_total_minor" >= 0)
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_order" ON "order_items" ("order_id")`
    )

    await queryRunner.query(`
      CREATE TABLE "order_item_ingredients" (
        "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_item_id"       uuid         NOT NULL REFERENCES "order_items"("id") ON DELETE CASCADE,
        "ingredient_id"       uuid         NOT NULL REFERENCES "ingredients"("id") ON DELETE RESTRICT,
        "position"            integer      NOT NULL,
        "name_snapshot"       varchar(128) NOT NULL,
        "price_minor_snapshot" integer     NOT NULL CHECK ("price_minor_snapshot" >= 0)
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_order_item_ingredients_item" ON "order_item_ingredients" ("order_item_id")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_item_ingredients"`)
    await queryRunner.query(`DROP TABLE "order_items"`)
    await queryRunner.query(`DROP TABLE "orders"`)
    await queryRunner.query(`DROP TABLE "sizes"`)
    await queryRunner.query(`DROP TABLE "ingredients"`)
    await queryRunner.query(`DROP TYPE "ingredient_category"`)
  }
}
