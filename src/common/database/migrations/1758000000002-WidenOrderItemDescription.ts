import { MigrationInterface, QueryRunner } from 'typeorm'

export class WidenOrderItemDescription1758000000002 implements MigrationInterface {
  name = 'WidenOrderItemDescription1758000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "description" TYPE text`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "description" TYPE varchar(512)`
    )
  }
}
