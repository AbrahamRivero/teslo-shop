import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CurrencyCache } from './entities/currency-cache.entity';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService],
  imports: [
    TypeOrmModule.forFeature([CurrencyCache]),
    ScheduleModule.forRoot(),
  ],
  exports: [CurrencyService, TypeOrmModule],
})
export class CurrencyModule {}
