import { Module } from '@nestjs/common';
import { BatakController } from './batak.controller';
import { BatakService } from './batak.service';

@Module({
  controllers: [BatakController],
  providers: [BatakService],
})
export class BatakModule {}
