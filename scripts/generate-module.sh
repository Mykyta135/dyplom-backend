#!/bin/bash

# Check if module name is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/generate-module.sh <module-name>"
  exit 1
fi

MODULE_NAME=$1
# Convert to lowercase for folder names
MODULE_LOWER=$(echo "$MODULE_NAME" | tr '[:upper:]' '[:lower:]')
# Convert to PascalCase for Class names
MODULE_PASCAL=$(echo "$MODULE_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

BASE_PATH="src/modules/$MODULE_LOWER"

echo "🚀 Generating Hexagonal + CQRS structure for module: $MODULE_PASCAL"

# 1. Create Directory Structure
mkdir -p "$BASE_PATH/domain/entities"
mkdir -p "$BASE_PATH/domain/ports"
mkdir -p "$BASE_PATH/domain/commands/impl"
mkdir -p "$BASE_PATH/domain/commands/handlers"
mkdir -p "$BASE_PATH/domain/queries/impl"
mkdir -p "$BASE_PATH/domain/queries/handlers"
mkdir -p "$BASE_PATH/domain/events"

mkdir -p "$BASE_PATH/infrastructure/persistence/entities"
mkdir -p "$BASE_PATH/infrastructure/persistence/repositories"
mkdir -p "$BASE_PATH/infrastructure/api/controllers"
mkdir -p "$BASE_PATH/infrastructure/api/dtos/request"
mkdir -p "$BASE_PATH/infrastructure/api/dtos/response"
mkdir -p "$BASE_PATH/infrastructure/mappers"

# 2. Create Boilerplate Files

# Domain Port (Repository Interface)
cat <<EOF > "$BASE_PATH/domain/ports/${MODULE_LOWER}.repository.port.ts"
export abstract class ${MODULE_PASCAL}RepositoryPort {
  // Define abstract methods here
}
EOF

# Domain Entity
cat <<EOF > "$BASE_PATH/domain/entities/${MODULE_LOWER}.entity.ts"
export class ${MODULE_PASCAL} {
  constructor(
    public readonly id: string,
    // Add domain properties here
  ) {}
}
EOF

# Mapper
cat <<EOF > "$BASE_PATH/infrastructure/mappers/${MODULE_LOWER}.mapper.ts"
import { ${MODULE_PASCAL} } from '../domain/entities/${MODULE_LOWER}.entity';
import { ${MODULE_PASCAL}OrmEntity } from '../persistence/entities/${MODULE_LOWER}.orm-entity';

export class ${MODULE_PASCAL}Mapper {
  static toDomain(orm: ${MODULE_PASCAL}OrmEntity): ${MODULE_PASCAL} {
    return new ${MODULE_PASCAL}(orm.id);
  }

  static toPersistence(domain: ${MODULE_PASCAL}): ${MODULE_PASCAL}OrmEntity {
    const orm = new ${MODULE_PASCAL}OrmEntity();
    orm.id = domain.id;
    return orm;
  }
}
EOF

# ORM Entity
cat <<EOF > "$BASE_PATH/infrastructure/persistence/entities/${MODULE_LOWER}.orm-entity.ts"
import { Entity, PrimaryColumn } from 'typeorm';

@Entity('${MODULE_LOWER}s')
export class ${MODULE_PASCAL}OrmEntity {
  @PrimaryColumn('uuid')
  id: string;
}
EOF

# Controller
cat <<EOF > "$BASE_PATH/infrastructure/api/controllers/${MODULE_LOWER}.controller.ts"
import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('${MODULE_PASCAL}')
@Controller('${MODULE_LOWER}s')
export class ${MODULE_PASCAL}Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
}
EOF

# Module file
cat <<EOF > "$BASE_PATH/${MODULE_LOWER}.module.ts"
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${MODULE_PASCAL}Controller } from './infrastructure/api/controllers/${MODULE_LOWER}.controller';
import { ${MODULE_PASCAL}OrmEntity } from './infrastructure/persistence/entities/${MODULE_LOWER}.orm-entity';
import { ${MODULE_PASCAL}RepositoryPort } from './domain/ports/${MODULE_LOWER}.repository.port';
import { ${MODULE_PASCAL}TypeOrmRepository } from './infrastructure/persistence/repositories/${MODULE_LOWER}-typeorm.repository';

const CommandHandlers = [];
const QueryHandlers = [];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([${MODULE_PASCAL}OrmEntity]),
  ],
  controllers: [${MODULE_PASCAL}Controller],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: ${MODULE_PASCAL}RepositoryPort,
      useClass: ${MODULE_PASCAL}TypeOrmRepository,
    },
  ],
})
export class ${MODULE_PASCAL}Module {}
EOF

# Empty Repository Implementation to avoid build errors
cat <<EOF > "$BASE_PATH/infrastructure/persistence/repositories/${MODULE_LOWER}-typeorm.repository.ts"
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${MODULE_PASCAL}RepositoryPort } from '../../../domain/ports/${MODULE_LOWER}.repository.port';
import { ${MODULE_PASCAL}OrmEntity } from '../entities/${MODULE_LOWER}.orm-entity';

@Injectable()
export class ${MODULE_PASCAL}TypeOrmRepository implements ${MODULE_PASCAL}RepositoryPort {
  constructor(
    @InjectRepository(${MODULE_PASCAL}OrmEntity)
    private readonly ormRepo: Repository<${MODULE_PASCAL}OrmEntity>,
  ) {}
}
EOF

chmod +x "$BASE_PATH"

echo "✅ Module $MODULE_PASCAL created successfully at $BASE_PATH"