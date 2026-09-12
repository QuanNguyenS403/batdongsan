import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [AuthModule, EmailModule, OutboxModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
