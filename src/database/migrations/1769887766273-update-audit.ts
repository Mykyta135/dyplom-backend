import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAudit1769887766273 implements MigrationInterface {
  name = 'UpdateAudit1769887766273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "event_timestamp" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `UPDATE "audit_logs" SET "event_timestamp" = "timestamp" WHERE "event_timestamp" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "event_timestamp" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "ip" TYPE inet USING "ip"::inet`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "ip" TYPE character varying USING "ip"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "event_timestamp"`,
    );
  }
}
