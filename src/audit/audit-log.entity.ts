import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tracking_id' })
  trackingId: string;

  @Column()
  action: string;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: unknown;

  @Column({ name: 'event_timestamp', type: 'timestamp with time zone' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
