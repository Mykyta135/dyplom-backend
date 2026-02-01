import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAudit1769887766273 implements MigrationInterface {
  name = 'UpdateAudit1769887766273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "event_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "ip"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "ip" inet`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "ip"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "ip" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "event_timestamp"`,
    );
  }
}
