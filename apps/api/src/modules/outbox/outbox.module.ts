import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [PrismaModule, EmailModule, GoogleSheetsModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
