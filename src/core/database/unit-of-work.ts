import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class UnitOfWork {
  private static readonly context = new AsyncLocalStorage<EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  getManager(): EntityManager {
    return UnitOfWork.context.getStore() ?? this.dataSource.manager;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return UnitOfWork.context.run(queryRunner.manager, async () => {
      try {
        const result = await work();
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  }
}
