import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceService } from './attendance/attendance.service';
import { LeavesController } from './leaves/leaves.controller';
import { LeavesService } from './leaves/leaves.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AttendanceController, LeavesController],
  providers: [AttendanceService, LeavesService],
})
export class HrModule {}
