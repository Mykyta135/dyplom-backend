import {
  Body,
  CanActivate,
  Controller,
  Get,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Injectable()
export class NonProductionGuard implements CanActivate {
  canActivate(): boolean {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new NotFoundException();
    }
    return true;
  }
}

class TestResponseDto {
  message: string;

  @Exclude()
  internalSecret: string;

  constructor(partial: Partial<TestResponseDto>) {
    Object.assign(this, partial);
  }
}

@ApiExcludeController()
@Controller('dev/test')
@UseGuards(NonProductionGuard)
export class InfrastructureTestController {
  @Get('transform')
  testTransform() {
    return new TestResponseDto({
      message: 'Now the secret should be gone!',
      internalSecret: 'HIDDEN_DATA',
    });
  }

  @Get('timeout')
  async testTimeout() {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    return { message: 'This will never be reached' };
  }

  @Get('circuit-breaker')
  testCircuit(@Query('fail') fail: string) {
    if (fail === 'true') {
      throw new InternalServerErrorException('Simulated Failure');
    }
    return { status: 'System is healthy' };
  }

  @Post('sanitize-test')
  testSanitization(@Body() body: Record<string, unknown>) {
    return {
      receivedBody: body,
      message: 'Check your terminal to see if the script was neutralized!',
    };
  }
}
