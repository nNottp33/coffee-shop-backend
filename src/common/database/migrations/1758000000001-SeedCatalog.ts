import { MigrationInterface, QueryRunner } from 'typeorm'

export class SeedCatalog1758000000001 implements MigrationInterface {
  name = 'SeedCatalog1758000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "ingredients" ("code", "name", "category", "price_minor", "sort_order") VALUES
        ('COFFEE',        'Coffee',        'base',    5000, 1),
        ('TEA',           'Tea',           'base',    4000, 2),
        ('MILK',          'Milk',          'base',    3500, 3),
        ('VANILLA',       'Vanilla',       'syrup',   1000, 1),
        ('CARAMEL',       'Caramel',       'syrup',   1000, 2),
        ('CHOCOLATE',     'Chocolate',     'syrup',   1500, 3),
        ('WHIPPED_CREAM', 'Whipped Cream', 'topping', 1500, 1),
        ('CINNAMON',      'Cinnamon',      'topping',  500, 2),
        ('MARSHMALLOWS',  'Marshmallows',  'topping', 1200, 3)
    `)

    await queryRunner.query(`
      INSERT INTO "sizes" ("code", "name", "surcharge_minor", "sort_order") VALUES
        ('S', 'Small',     0, 1),
        ('M', 'Medium', 1000, 2),
        ('L', 'Large',  2000, 3)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "sizes" WHERE "code" IN ('S','M','L')`)
    await queryRunner.query(`
      DELETE FROM "ingredients" WHERE "code" IN
        ('COFFEE','TEA','MILK','VANILLA','CARAMEL','CHOCOLATE','WHIPPED_CREAM','CINNAMON','MARSHMALLOWS')
    `)
  }
}
