import { Module } from '@nestjs/common';
// Example: import { AuthController } from './controllers/auth.controller';
// Example: import { AuthService } from './services/auth.service';
// Example: import { JwtStrategy } from './guards/jwt.strategy';

@Module({
  imports: [
    // Other modules this one depends on, e.g., JwtModule, TypeOrmModule.forFeature([User])
  ],
  controllers: [
    /* AuthController */
  ],
  providers: [
    /* AuthService, JwtStrategy */
  ],
})
export class AuthModule {}
