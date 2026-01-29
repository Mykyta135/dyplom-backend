import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
// test button for commit
@ApiTags('Default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({ description: 'Returns a simple "Hello World!" message.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
