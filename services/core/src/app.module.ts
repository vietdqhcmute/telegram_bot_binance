import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import * as mongoosePaginate from 'mongoose-paginate-v2';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotSignalModule } from './modules/bots/bot.module';
import { HolderModule } from './modules/holders/holder.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    HolderModule,
    BotSignalModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: async () => ({
        // uri: 'mongodb://signalbot:signalbot@54.169.255.84:27017/signalbot',
        uri: 'mongodb://localhost:27017/signalbot',
        // Config pagination for all models
        connectionFactory: (connection) => {
          connection.plugin(mongoosePaginate);
          return connection;
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
