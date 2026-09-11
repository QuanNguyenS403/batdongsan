import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmailModule } from '../email/email.module';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [EmailModule, GoogleSheetsModule, TasksModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

