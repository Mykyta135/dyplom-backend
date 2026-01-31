/**
 * Generic Mapper Interface
 * D = Domain Entity
 * O = ORM/Persistence Entity
 */
export interface Mapper<D, O> {
  /**
   * Converts a Database Entity to a Domain Entity
   */
  toDomain(ormEntity: O): D;

  /**
   * Converts a Domain Entity to a Database Entity
   */
  toPersistence(domainEntity: D): O;
}
