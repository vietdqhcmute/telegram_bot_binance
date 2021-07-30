import { HttpService, Injectable, Logger } from '@nestjs/common';
import * as Binance from 'node-binance-api';
import * as _ from 'lodash';

const binance = new Binance().options({
  // APIKEY: 'HtWiSRZ8QV3tmhKXMGKsM0jdTQoW2RNaKOaaSuaBDK0R4OdKxDv4YMLaQSpU9RCY',
  // APISECRET: 'wd6pIX8BrtKdfSJL2z1D4GhoOX8bjUPFfeWCRQwmOqmozF65KQRbnmIyrMf2vidT'
});

@Injectable()
export class BinanceService {
  constructor(private httpService: HttpService) {
  }

  async getCurrentDepth(pair: string) {
    const deptData = await binance.depth(pair);
    return deptData;
  }

  async priceOf(symbol: string): Promise<number> {
    try {
      const price = await binance.prices(`${symbol.toUpperCase()}USDT`);
      return price[`${symbol.toUpperCase()}USDT`] || 0;
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'priceOf')
    }
    return 0;
  }

  async pricesOf(symbols: string[]): Promise<any> {
    let results = {};
    try {
      const prices = await binance.prices();
      symbols.map((symbol) => {
        results = { ...results, [`${symbol.toUpperCase()}`]: Number(prices[`${symbol.toUpperCase()}USDT`] || 0) };
      });
      return results;
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'pricesOf');
    }
    return results;
  }

  async percent24hChangeOf(symbol: string): Promise<number> {
    try {
      const data = await binance.prevDay(`${symbol.toUpperCase()}USDT`);
      return Number(data.priceChangePercent || 0);
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'percent24hChangeOf');
    }
    return 0;
  }

  async percent24hChangeOfCoins(symbols: string[]): Promise<any> {
    let results = {};
    try {
      const data = await binance.prevDay(false);
      symbols.map((symbol: any) => {
        const item = data.find((it) => it.symbol === `${symbol.toUpperCase()}USDT`);
        if (item) {
          results = { ...results, [`${symbol.toUpperCase()}`]: Number(_.get(item, `priceChangePercent`, 0)) };
        }
      });
      return results;
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'percent24hChangeOfCoins');
    }
    return results;
  }


  async percentChangeOf(symbol: string, intervalType: string): Promise<number> {
    try {
      const ticks = await binance.candlesticks(`${symbol.toUpperCase()}USDT`, '1d');
      let last_tick = ticks[ticks.length - 1];
      let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;

      const price = await binance.prices(`${symbol.toUpperCase()}USDT`);
      const currentPrice = price[`${symbol.toUpperCase()}USDT`];
      console.log(currentPrice - open);
      return Number(Number(((currentPrice - open || 0) / open) * 100).toFixed(4));
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'percent24hChangeOf')
    }
    return 0;
  }


}