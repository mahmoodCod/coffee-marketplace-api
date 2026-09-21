import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Coffee Marketplace API';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'coffee-marketplace-api',
      timestamp: new Date().toISOString(),
    };
  }
}
