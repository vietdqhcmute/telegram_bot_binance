import { HttpService, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import * as numeral from 'numeral';
import * as moment from 'moment';
import * as _ from 'lodash';

import { Telegraf } from 'telegraf';

import { BinanceService } from '../blockchain/binance.service';
import { HolderService } from '../holders/holder.service';
import { Follower } from './schema/follower.schema';

import { BotEventListerTypes } from 'src/omatech-package/types';
import { CoinsService } from './coin.service';
import { ETHGateway } from '../blockchain/eth.gateway';

var zmq = require('zeromq');
var bitcoin = require('bitcoinjs-lib');
const Socket = require('blockchain.info/Socket');
const EventEmitter = require('events');

const messages = {
  'BIG_PRICE_CHANGE_PERCENT': 'Big price fluctuations signal',
  'SHAKR_PUMP_DUMP': 'Shark Pump/Dump price signal',
};

const coinsList = ['BTC', 'ETH', 'DOGE'];

// Coin to alert shark Pump/Dump - default 1000000
const AlertValue = 1000000;

@Injectable()
export class BotsService {
  // telegramToken = '1867601575:AAF8ng5DUa0MEeTB7ATZdqQUSvIcdeYv9sM';
  telegramBot = undefined;
  prices = [];
  constructor(
    @InjectModel(Follower.name) private readonly followerModel: Model<Follower>,
    private readonly holderSerivce: HolderService,
    private readonly binanceService: BinanceService,
    private readonly httpService: HttpService,
    private readonly coinService: CoinsService,
    private readonly ethGateway: ETHGateway,
  ) {
    this.telegramBot = new Telegraf('1939599714:AAFubH5LTiPGeZw6Bzvnbeazkw30-CI3Oeo');
    this.botSetup();
    this.sharkBTCListner();
    this.sharkETHListner();
    this.autoUpdatePrices();
  }

  async autoUpdatePrices() {
    this.prices['btc'] = await this.coinService.getPrice('bitcoin');
    this.prices['eth'] = await this.coinService.getPrice('ethereum');
    this.prices['dogecoin'] = await this.coinService.getPrice('dogecoin');
    setInterval(async () => {
      this.prices['btc'] = await this.coinService.getPrice('bitcoin');
      this.prices['eth'] = await this.coinService.getPrice('ethereum');
      this.prices['dogecoin'] = await this.coinService.getPrice('dogecoin');
    }, 5000);
  }

  getPrice(asset: string): number {
    if (['usdt', 'usdc', 'busd'].includes(asset)) {
      return 1;
    }
    return this.prices[asset] || 0;
  }

  renderAlertIcons(value: number): String {
    let symbol = value > 10000000 ? '????' : '????'
    let message = `${symbol} ${symbol}`;
    let count = value > 10000000 ? value / 10000000 : value / 10000000;
    if (count > 2) {
      return message + `${symbol} ${symbol}`;
    }
    for (let i = 0; i < count - 1; i++) {
      message = message + ` ${symbol}`;
    }
    return message;
  }

  async sharkBTCListner() {
    const blockChainInfo = new Socket();
    blockChainInfo.onTransaction(async (txObj) => {
      let txHashObj = this.handleTx(txObj);
      const btcAmount = txHashObj.val * 1e-8;
      const btcUSDValue = this.getPrice('btc') * btcAmount;
      const senderAddrs = _.map(txHashObj.vin, (item) => item ? Object.keys(item)[0] : '');
      const receipientAddrs = _.map(txHashObj.vout, (item) => item ? Object.keys(item)[0] : '');
      if (btcUSDValue >= 1000000) {
        const sender = await this.holderSerivce.getByAddresses(senderAddrs, 'btc');
        const receipient = await this.holderSerivce.getByAddresses(receipientAddrs, 'btc');
        // console.log('tx', txHashObj.txid, btcAmount, numeral(btcUSDValue).format('0,0.00'));
        const message = `${this.renderAlertIcons(btcUSDValue)} ${numeral(btcAmount).format('0,0.00')} #BTC ($${numeral(btcUSDValue).format('0,0.00')}) transferred from #${_.get(sender, 'alias') || 'unknown wallet'} to #${_.get(receipient, 'alias') || 'unknown wallet'}`;
        this.sendMessageToFollower(message, ['SHAKR_PUMP_DUMP']);
      }
    });
  }

  async sharkETHListner() {
    this.ethGateway.eventListener(async (txObj) => {
      const { fromAddress, toAddress, asset, amount } = txObj;
      const usdValue = this.getPrice(asset.toLowerCase()) * amount;
      if (usdValue >= 1000000) {
        const sender = await this.holderSerivce.getByAddresses(fromAddress, asset.toLowerCase());
        const receipient = await this.holderSerivce.getByAddresses(toAddress, asset.toLowerCase());
        const message = `${this.renderAlertIcons(usdValue)}  ${numeral(amount).format('0,0.00')} #${asset.toUpperCase()} ($${numeral(usdValue).format('0,0.00')}) transferred from #${_.get(sender, 'alias') || 'unknown wallet'} to #${_.get(receipient, 'alias') || 'unknown wallet'}`;
        this.sendMessageToFollower(message, ['SHAKR_PUMP_DUMP']);
      }
    });
  }

  handleTx(txObj) {
    let inputs = txObj['inputs'];
    let outputs = txObj['out'];
    let vin = [];
    let vout = [];
    let inputsAmount = 0;
    let outputAmount = 0;
    let addressSet = new Set();

    for (let inputIter in inputs) {
      let input = inputs[inputIter]['prev_out'];
      let vinItem = {};
      let val = input['value'];
      let addr = input['addr'];
      vinItem[addr] = val;
      inputsAmount += val;
      vin.push(vinItem);
      addressSet.add(addr);
    }

    for (let outputIter in outputs) {
      let output = outputs[outputIter];
      let outItem = {};
      let val = output['value'];
      let addr = output['addr'];
      outItem[addr] = val;
      outputAmount += val;
      vout.push(outItem);
      addressSet.add(addr);
    }

    let txHashObj = {
      'txid': txObj['hash'],
      'txAt': txObj['time'],
      'vout': vout,
      'vin': vin,
      'fee': inputsAmount - outputAmount,
      'val': outputAmount,
      'addr': addressSet
    };
    return txHashObj;
  }

  botSetup() {
    this.telegramBot.start((ctx) => ctx.reply(
      `
      Xin ch??o, m??nh l?? BE !!
      ????y l?? h?????ng d???n s??? d???ng c???a m??nh nh??.
      /shark on/off - B???t th??ng b??o t??n hi???u c?? m???p gom h??ng, x??? h??ng
      /PumpDump on/off - B???t th??ng b??o t??n hi???u bi???n ?????ng m???nh c???a th??? tr?????ng
      /xemgiaBTC
      /xemgiaETH
      /xemgiaDOGE
      /depth - Xem th???ng k?? volume l???nh bids/asks tr??n s??n Binance
    `
    ));
    this.telegramBot.help((ctx) => ctx.reply(
      `
      Xin ch??o, m??nh l?? BE !!
      ????y l?? h?????ng d???n s??? d???ng c???a m??nh nh??.
      /shark on/off - B???t th??ng b??o t??n hi???u c?? m???p gom h??ng, x??? h??ng
      /PumpDump on/off - B???t th??ng b??o t??n hi???u bi???n ?????ng m???nh c???a th??? tr?????ng
      /xemgiaBTC
      /xemgiaETH
      /xemgiaDOGE
      /depth - Xem th???ng k?? volume l???nh bids/asks tr??n s??n Binance
    `
    ));
    this.telegramBot.on('sticker', (ctx) => ctx.reply('????'));
    this.telegramBot.hears('hi', (ctx) => ctx.reply(`Xin ch??o, ch??c m???t ng??y t???t l??nh ${JSON.stringify(ctx.message)}`));
    // Basic command
    this.telegramBot.command('xemgiaBTC', (ctx) => this.replyCoinPrice(ctx, 'BTC'));
    this.telegramBot.command('xemgiaETH', (ctx) => this.replyCoinPrice(ctx, 'ETH'));
    this.telegramBot.command('xemgiaDOGE', (ctx) => this.replyCoinPrice(ctx, 'DOGE'));
    this.telegramBot.command('PumpDump', (ctx) => this.applyEventListner(ctx, 'BIG_PRICE_CHANGE_PERCENT'));
    this.telegramBot.command('shark', (ctx) => this.applyEventListner(ctx, 'SHAKR_PUMP_DUMP'));

    this.telegramBot.launch();
  }

  /**
   * Function handle send coin price
   * @param ctx
   * @param asset
   */
  async replyCoinPrice(ctx: any, asset: string) {
    asset = asset.toUpperCase();
    const btcPrice = await this.binanceService.priceOf(asset);
    const priceChangePercent = await this.binanceService.percent24hChangeOf(asset);
    ctx.reply(`${asset} Prices: $${numeral(btcPrice).format('0,0.00000000')} (${numeral(priceChangePercent).format('0.00')}%)`);
  }

  /**
   *  Handle apply event lister for user
   * @param ctx
   * @param command
   */
  async applyEventListner(ctx: any, command: BotEventListerTypes) {
    const follower = await this.followerModel.findOne({ isDeleted: false, chatID: ctx.message.chat.id });
    if (!follower) {
      await this.followerModel.create({
        chatID: ctx.message.chat.id,
        listenTypes: [command]
      });
      ctx.reply(`Apply ${messages[command]} successfully!.`);
    } else {
      if (!follower.listenTypes.includes(command)) {
        this.addFollowerListenTypes(ctx.message.chat.id, command);
        ctx.reply(`Apply ${messages[command]} successfully!.`);
      } else {
        this.removeFollowerListenTypes(ctx.message.chat.id, command);
        ctx.reply(`Disable ${messages[command]} successfully!.`);
      }
    }
  }

  async addFollowerListenTypes(chatID: string, listenType: BotEventListerTypes) {
    await this.followerModel.updateOne(
      { chatID },
      { $push: { listenTypes: listenType } }
    );
  }

  async removeFollowerListenTypes(chatID: string, listenType: BotEventListerTypes) {
    await this.followerModel.updateOne(
      { chatID },
      { $pull: { listenTypes: { $in: [listenType] } } }
    );
  }

  @Cron('* */15 * * * *')
  // Every 15 minute
  async sendSignalBigPriceChange() {
    const prices = await this.binanceService.pricesOf(coinsList);
    const priceChangePercents = await this.binanceService.percent24hChangeOfCoins(coinsList);
    // Only send if change percent get greater than 10%
    let message = '';
    coinsList.map((symbol: any, index: number) => {
      if (priceChangePercents[symbol] <= -20 || priceChangePercents[symbol] >= 20) {
        if (message.length <= 0) {
          message = message + `!!! *COIN PRICE ALERT* !!!\n`;
        }
        message = message + `${symbol} 24h change: ${numeral(prices[symbol]).format('0,0.00000000')} (${priceChangePercents[symbol] > 0 ? '+' : ''}${numeral(priceChangePercents[symbol]).format('0.00')}%)\n`;
      }
    });

    if (message.length > 0) {
      // const followers = await this.followerModel.find({ isDeleted: false, listenTypes: { $in: ['BIG_PRICE_CHANGE_PERCENT'] } });
      await this.sendMessageToFollower(message, ['BIG_PRICE_CHANGE_PERCENT']);
    }
  }

  async sendMessageToFollower(message: string, listenTypes: BotEventListerTypes[]) {
    const followers = await this.followerModel.find({ isDeleted: false, listenTypes: { $in: listenTypes } });
    followers.map(async (follower) => {
      // Dismiss for lister which just receive alert a minute ago
      if (moment().diff(moment(follower.lastestSent), 'minute') >= 1) {
        this.telegramBot.telegram.sendMessage(follower.chatID, message, { parseMode: "HTML" });
        this.followerModel.updateOne({ chatID: follower.chatID }, { lastestSent: moment().toDate() }).exec();
      }
    });
  }

  @Cron('0 */5 * * * *')
  // @Interval(60 * 1000)
  // Every 5 minutes
  async handleCron() {
    this.holderSerivce.syncETHBalance().then((rs) => this.holderSerivce.syncHolderData(rs));
    this.holderSerivce.syncBTCBalance().then((rs) => this.holderSerivce.syncHolderData(rs));
    this.holderSerivce.syncDOGEBalance().then((rs) => this.holderSerivce.syncHolderData(rs));
  }
}
