import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { AdminMembershipController } from './admin-membership.controller';
import { EmailModule } from '../email/email.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [EmailModule, OutboxModule],
  controllers: [MembershipController, AdminMembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
