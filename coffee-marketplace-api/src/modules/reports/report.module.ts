import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportController } from './controllers/report.controller';
import { SellerReportController } from './controllers/seller-report.controller';

import { ReportService } from './services/report.service';
import { ReportRepository } from './repositories/report.repository';

import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    /**
     * Register the entities required by the report repository.
     *
     * Report queries read orders, products, users, and payments from
     * existing business data without creating a separate report table.
     */
    TypeOrmModule.forFeature([Order, Product, User, Payment]),
  ],
  controllers: [ReportController, SellerReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}
