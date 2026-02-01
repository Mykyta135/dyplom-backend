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

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: unknown;

  @CreateDateColumn({ name: 'created_at' })
  timestamp: Date;
}
