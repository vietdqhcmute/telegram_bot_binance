import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ETHGateway } from '../blockchain/eth.gateway';
import { HolderController } from './holder.controller';
import { HolderService } from './holder.service';
import { HolderBalanceHistory, HolderBalanceHistorySchema } from './holder.balance.histories.schema';
import { BTCGateway } from '../blockchain/btc.gateway';
import { DOGEGateway } from '../blockchain/doge.gateway';
import { Holder, HolderSchema } from './holder.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: HolderBalanceHistory.name, schema: HolderBalanceHistorySchema },
      { name: Holder.name, schema: HolderSchema }
    ]),
  ],
  controllers: [HolderController],
  providers: [HolderService, ETHGateway, BTCGateway, DOGEGateway],
})
export class HolderModule { }
