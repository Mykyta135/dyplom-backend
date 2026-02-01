import { Column, Entity } from 'typeorm';
import { BaseOrmEntity } from '../../database/base.orm-entity';

@Entity('outbox')
export class OutboxEntity extends BaseOrmEntity {
  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string;

  @Column({ name: 'event_name', type: 'varchar' })
  eventName: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>; // We will ensure the DomainEvent is mapped to this type

  @Column({ type: 'varchar', default: 'PENDING' })
  status: 'PENDING' | 'PROCESSED' | 'FAILED';

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
