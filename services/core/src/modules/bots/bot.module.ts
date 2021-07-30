import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BinanceService } from '../blockchain/binance.service';
import { BTCGateway } from '../blockchain/btc.gateway';
import { DOGEGateway } from '../blockchain/doge.gateway';
import { ETHGateway } from '../blockchain/eth.gateway';

import { BotController } from './bot.controller';
import { HolderService } from '../holders/holder.service';
import { BotsService } from './bot.service';

import { Follower, FollowerSchema } from './schema/follower.schema';
import {
  HolderBalanceHistory,
  HolderBalanceHistorySchema,
} from '../holders/holder.balance.histories.schema';
import { Holder, HolderSchema } from '../holders/holder.schema';
import { CoinsService } from './coin.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: HolderBalanceHistory.name, schema: HolderBalanceHistorySchema },
      { name: Follower.name, schema: FollowerSchema },
      { name: Holder.name, schema: HolderSchema },
    ]),
  ],
  controllers: [BotController],
  providers: [
    BotsService,
    HolderService,
    CoinsService,
    ETHGateway,
    BTCGateway,
    DOGEGateway,
    BinanceService,
  ],
})
export class BotSignalModule {}
