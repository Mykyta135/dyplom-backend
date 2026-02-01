import { v4 as uuidv4 } from 'uuid';

/**
 * A Domain Event is a base class for events that occur within the domain.
 * It contains common information like the event ID, the aggregate ID it belongs to,
 * and the timestamp of when it occurred.
 */
export abstract class DomainEvent {
  /** A unique identifier for this specific event instance. */
  public readonly eventId: string;

  /** The ID of the aggregate root that this event is associated with (e.g., a User ID). */
  public readonly aggregateId: string;

  /** The timestamp when the event was created. */
  public readonly occurredOn: Date;

  constructor(aggregateId: string) {
    this.eventId = uuidv4();
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }
}
