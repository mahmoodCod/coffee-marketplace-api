import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration, validationSchema } from './config';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SellerModule } from './modules/sellers/seller.module';
import { ProductModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventoryes/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema: validationSchema,
      expandVariables: true,
    }),
    DatabaseModule,
    ConfigModule,
    RolesModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    SellerModule,
    ProductModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
