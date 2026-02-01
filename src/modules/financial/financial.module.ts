import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FinancialController],
  providers: [FinancialService],
})
export class FinancialModule {}
