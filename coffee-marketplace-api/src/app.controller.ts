import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Lightweight liveness probe used by Docker / orchestrators.
   * Must stay unauthenticated and dependency-light.
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Service is up',
    schema: {
      example: {
        status: 'ok',
        service: 'coffee-marketplace-api',
        timestamp: '2026-09-21T00:00:00.000Z',
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
