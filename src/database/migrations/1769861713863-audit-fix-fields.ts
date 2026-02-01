import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditFixFields1769861713863 implements MigrationInterface {
  name = 'AuditFixFields1769861713863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" RENAME COLUMN "timestamp" TO "created_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" RENAME COLUMN "created_at" TO "timestamp"`,
    );
  }
}
