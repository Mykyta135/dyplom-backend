import { QueryRunner } from 'typeorm';

export const runMigration = async (
  queryRunner: QueryRunner,
  upQueries: string[],
) => {
  // Ensure UUID support is always enabled
  await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  for (const query of upQueries) {
    await queryRunner.query(query);
  }
};
