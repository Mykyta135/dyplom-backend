import { UnitOfWork } from 'src/core/database/unit-of-work';
import { EntityManager, Repository } from 'typeorm';
import { BaseOrmEntity } from '../database/base.orm-entity';
import { Criteria } from '../domain/criteria';
import { DomainEvent } from '../domain/domain-event.base';
import { OutboxEntity } from '../infrastructure/persistence/outbox.entity';
import { Mapper } from './mapper.interface';

export abstract class BaseRepository<D, O extends BaseOrmEntity> {
  constructor(
    protected readonly uow: UnitOfWork,
    protected readonly ormRepo: Repository<O>,
    protected readonly mapper: Mapper<D, O>,
  ) {}

  /**
   * Saves an entity and its associated domain events atomically using the Outbox Pattern.
   * @param entity The domain entity to save.
   * @param events An array of DomainEvent instances to be saved to the outbox.
   */
  async saveWithEvents(entity: D, events: DomainEvent[]): Promise<D> {
    const manager = this.uow.getManager();
    const ormEntity = this.mapper.toPersistence(entity);

    const execute = async (transactionalManager: EntityManager) => {
      const savedOrmEntity = await transactionalManager.save(ormEntity);

      const outboxEvents = events.map((event) => {
        const outbox = new OutboxEntity();
        outbox.aggregateId = event.aggregateId;
        outbox.eventName = event.constructor.name;

        const payloadObject = JSON.parse(JSON.stringify(event)) as Record<
          string,
          unknown
        >;

        outbox.payload = payloadObject;
        outbox.status = 'PENDING';
        return outbox;
      });

      await transactionalManager.save(outboxEvents);
      return this.mapper.toDomain(savedOrmEntity);
    };
    if (manager.queryRunner?.isTransactionActive) {
      return execute(manager);
    }
    return manager.transaction(execute);
  }

  async findByCriteria(criteria: Criteria): Promise<[D[], number]> {
    const queryBuilder = this.ormRepo.createQueryBuilder('entity');

    const allowedFields = new Set(
      this.ormRepo.metadata.columns.map((c) => c.propertyName),
    );

    criteria.filters.forEach((filter, idx) => {
      if (!allowedFields.has(filter.field)) {
        throw new Error(
          `Invalid filter field: '${filter.field}'. Field does not exist on entity.`,
        );
      }

      const paramName = `val_${String(idx)}`;
      queryBuilder.andWhere(`entity.${filter.field} = :${paramName}`, {
        [paramName]: filter.value,
      });
    });

    const sortBy = criteria.sortBy ?? 'createdAt';
    if (!allowedFields.has(sortBy)) {
      throw new Error(
        `Invalid sort field: '${sortBy}'. Field does not exist on entity.`,
      );
    }

    queryBuilder
      .skip((criteria.page - 1) * criteria.limit)
      .take(criteria.limit)
      .orderBy(`entity.${sortBy}`, criteria.sortOrder);

    const [items, total] = await queryBuilder.getManyAndCount();
    return [items.map((item) => this.mapper.toDomain(item)), total];
  }
}
