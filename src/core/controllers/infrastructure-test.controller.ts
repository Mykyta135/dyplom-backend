import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
class TestResponseDto {
  message: string;

  @Exclude() // This tells the interceptor to REMOVE this field
  internalSecret: string;

  constructor(partial: Partial<TestResponseDto>) {
    Object.assign(this, partial);
  }
}
@ApiExcludeController() // Keep this out of your public API docs
@Controller('dev/test')
export class InfrastructureTestController {
  // 1. Test Transform & NullStripper & ClassSerializer
  @Get('transform')
  testTransform() {
    return new TestResponseDto({
      message: 'Now the secret should be gone!',
      internalSecret: 'HIDDEN_DATA',
    });
  }

  // 2. Test TimeoutInterceptor
  @Get('timeout')
  async testTimeout() {
    // Wait 6 seconds (1s longer than our 5s timeout)
    await new Promise((resolve) => setTimeout(resolve, 6000));
    return { message: 'This will never be reached' };
  }

  // 3. Test CircuitBreaker & ExceptionFilter
  @Get('circuit-breaker')
  testCircuit(@Query('fail') fail: string) {
    if (fail === 'true') {
      throw new InternalServerErrorException('Simulated Failure');
    }
    return { status: 'System is healthy' };
  }
}
