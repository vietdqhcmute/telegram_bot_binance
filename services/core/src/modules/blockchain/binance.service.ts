import { HttpService, Injectable, Logger } from '@nestjs/common';
import * as Binance from 'node-binance-api';
import * as _ from 'lodash';

const binance = new Binance().options({
  APIKEY: 'xK3qD2IumttXzZJ6RCsCfMNo4etCpQoyN0pA4RWIDM71i8Xwvjd8uaaXsWF70boz',
  APISECRET: 'MJL8FwvsPapIYS2fuwnc7LnHcBmhMy5CXqZs18h31t7TigzWcbiQ2dfgIfjriUar',
});

const TRADING_CURRENCY = [
  'LTC',
  'ETH',
  'NEO',
  'BNB',
  'QTUM',
  'EOS',
  'SNT',
  'BNT',
  'GAS',
  'BCC',
  'USDT',
  'HSR',
  'OAX',
  'DNT',
  'MCO',
  'ICN',
  'ZRX',
  'OMG',
  'WTC',
  'YOYO',
  'LRC',
  'TRX',
  'SNGLS',
  'STRAT',
  'BQX',
  'FUN',
  'KNC',
  'CDT',
  'XVG',
  'IOTA',
  'SNM',
  'LINK',
  'CVC',
  'TNT',
  'REP',
  'MDA',
  'MTL',
  'SALT',
  'NULS',
  'SUB',
  'STX',
  'MTH',
  'ADX',
  'ETC',
  'ENG',
  'ZEC',
  'AST',
  'GNT',
  'DGD',
  'BAT',
  'DASH',
  'POWR',
  'BTG',
  'REQ',
  'XMR',
  'EVX',
  'VIB',
  'ENJ',
  'VEN',
  'ARK',
  'XRP',
  'MOD',
  'STORJ',
  'KMD',
  'RCN',
  'EDO',
  'DATA',
  'DLT',
  'MANA',
  'PPT',
  'RDN',
  'GXS',
  'AMB',
  'ARN',
  'BCPT',
  'CND',
  'GVT',
  'POE',
  'BTS',
  'FUEL',
  'XZC',
  'QSP',
  'LSK',
  'BCD',
  'TNB',
  'ADA',
  'LEND',
  'XLM',
  'CMT',
  'WAVES',
  'WABI',
  'GTO',
  'ICX',
  'OST',
  'ELF',
  'AION',
  'WINGS',
  'BRD',
  'NEBL',
  'NAV',
  'VIBE',
  'LUN',
  'TRIG',
  'APPC',
  'CHAT',
  'RLC',
  'INS',
  'PIVX',
  'IOST',
  'STEEM',
  'NANO',
  'AE',
  'VIA',
  'BLZ',
  'SYS',
  'RPX',
  'NCASH',
  'POA',
  'ONT',
  'ZIL',
  'STORM',
  'XEM',
  'WAN',
  'WPR',
  'QLC',
  'GRS',
  'CLOAK',
  'LOOM',
  'BCN',
  'TUSD',
  'ZEN',
  'SKY',
  'THETA',
  'IOTX',
  'QKC',
  'AGI',
  'NXS',
  'SC',
  'NPXS',
  'KEY',
  'NAS',
  'MFT',
  'DENT',
  'IQ',
  'ARDR',
  'HOT',
  'VET',
  'DOCK',
  'POLY',
  'VTHO',
  'ONG',
  'PHX',
  'HC',
  'GO',
  'PAX',
  'RVN',
  'DCR',
  'USDC',
  'MITH',
  'BCHABC',
  'BCHSV',
  'REN',
  'BTT',
  'USDS',
  'FET',
  'TFUEL',
  'CELR',
  'MATIC',
  'ATOM',
  'PHB',
  'ONE',
  'FTM',
  'BTCB',
  'USDSB',
  'CHZ',
  'COS',
  'ALGO',
  'ERD',
  'DOGE',
  'BGBP',
  'DUSK',
  'ANKR',
  'WIN',
  'TUSDB',
  'COCOS',
  'PERL',
  'TOMO',
  'BUSD',
  'BAND',
  'BEAM',
  'HBAR',
  'XTZ',
  'NGN',
  'DGB',
  'NKN',
  'GBP',
  'EUR',
  'KAVA',
  'RUB',
  'UAH',
  'ARPA',
  'TRY',
  'CTXC',
  'AERGO',
  'BCH',
  'TROY',
  'BRL',
  'VITE',
  'FTT',
  'AUD',
  'OGN',
  'DREP',
  'BULL',
  'BEAR',
  'ETHBULL',
  'ETHBEAR',
  'XRPBULL',
  'XRPBEAR',
  'EOSBULL',
  'EOSBEAR',
  'TCT',
  'WRX',
  'LTO',
  'ZAR',
  'MBL',
  'COTI',
  'BKRW',
  'BNBBULL',
  'BNBBEAR',
  'HIVE',
  'STPT',
  'SOL',
  'IDRT',
  'CTSI',
  'CHR',
  'BTCUP',
  'BTCDOWN',
  'HNT',
  'JST',
  'FIO',
  'BIDR',
  'STMX',
  'MDT',
  'PNT',
  'COMP',
  'IRIS',
  'MKR',
  'SXP',
  'SNX',
  'DAI',
  'ETHUP',
  'ETHDOWN',
  'ADAUP',
  'ADADOWN',
  'LINKUP',
  'LINKDOWN',
  'DOT',
  'RUNE',
  'BNBUP',
  'BNBDOWN',
  'XTZUP',
  'XTZDOWN',
  'AVA',
  'BAL',
  'YFI',
  'SRM',
  'ANT',
  'CRV',
  'SAND',
  'OCEAN',
  'NMR',
  'LUNA',
  'IDEX',
  'RSR',
  'PAXG',
  'WNXM',
  'TRB',
  'EGLD',
  'BZRX',
  'WBTC',
  'KSM',
  'SUSHI',
  'YFII',
  'DIA',
  'BEL',
  'UMA',
  'EOSUP',
  'TRXUP',
  'EOSDOWN',
  'TRXDOWN',
  'XRPUP',
  'XRPDOWN',
  'DOTUP',
  'DOTDOWN',
  'NBS',
  'WING',
  'SWRV',
  'LTCUP',
  'LTCDOWN',
  'CREAM',
  'UNI',
  'OXT',
  'SUN',
  'AVAX',
  'BURGER',
  'BAKE',
  'FLM',
  'SCRT',
  'XVS',
  'CAKE',
  'SPARTA',
  'UNIUP',
  'UNIDOWN',
  'ALPHA',
  'ORN',
  'UTK',
  'NEAR',
  'VIDT',
  'AAVE',
  'FIL',
  'SXPUP',
  'SXPDOWN',
  'INJ',
  'FILDOWN',
  'FILUP',
  'YFIUP',
  'YFIDOWN',
  'CTK',
  'EASY',
  'AUDIO',
  'BCHUP',
  'BCHDOWN',
  'BOT',
  'AXS',
  'AKRO',
  'HARD',
  'KP3R',
  'RENBTC',
  'SLP',
  'STRAX',
  'UNFI',
  'CVP',
  'BCHA',
  'FOR',
  'FRONT',
  'ROSE',
  'HEGIC',
  'AAVEUP',
  'AAVEDOWN',
  'PROM',
  'BETH',
  'SKL',
  'GLM',
  'SUSD',
  'COVER',
  'GHST',
  'SUSHIUP',
  'SUSHIDOWN',
  'XLMUP',
  'XLMDOWN',
  'DF',
  'JUV',
  'PSG',
  'BVND',
  'GRT',
  'CELO',
  'TWT',
  'REEF',
  'OG',
  'ATM',
  'ASR',
  '1INCH',
  'RIF',
  'BTCST',
  'TRU',
  'DEXE',
  'CKB',
  'FIRO',
  'LIT',
  'PROS',
  'VAI',
  'SFP',
  'FXS',
  'DODO',
  'AUCTION',
  'UFT',
  'ACM',
  'PHA',
  'TVK',
  'BADGER',
  'FIS',
  'OM',
  'POND',
  'ALICE',
  'DEGO',
  'BIFI',
  'LINA',
];

@Injectable()
export class BinanceService {
  constructor(private httpService: HttpService) {}

  async getCurrentDepth(pair: string) {
    const deptData = await binance.depth(pair);
    return deptData;
  }

  async priceOf(symbol: string): Promise<number> {
    try {
      const price = await binance.prices(`${symbol.toUpperCase()}USDT`);
      return price[`${symbol.toUpperCase()}USDT`] || 0;
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'priceOf');
    }
    return 0;
  }

  async pricesOf(symbols: string[]): Promise<any> {
    let results = {};
    try {
      const prices = await binance.prices();
      symbols.map((symbol) => {
        results = {
          ...results,
          [`${symbol.toUpperCase()}`]: Number(
            prices[`${symbol.toUpperCase()}USDT`] || 0,
          ),
        };
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
        const item = data.find(
          (it) => it.symbol === `${symbol.toUpperCase()}USDT`,
        );
        if (item) {
          results = {
            ...results,
            [`${symbol.toUpperCase()}`]: Number(
              _.get(item, `priceChangePercent`, 0),
            ),
          };
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
      const ticks = await binance.candlesticks(
        `${symbol.toUpperCase()}USDT`,
        '1d',
      );
      const last_tick = ticks[ticks.length - 1];
      const [
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
      ] = last_tick;

      const price = await binance.prices(`${symbol.toUpperCase()}USDT`);
      const currentPrice = price[`${symbol.toUpperCase()}USDT`];
      console.log(currentPrice - open);
      return Number(
        Number(((currentPrice - open || 0) / open) * 100).toFixed(4),
      );
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'percent24hChangeOf');
    }
    return 0;
  }

  async info24hChangeOfCoins(baseSymbol: string): Promise<any> {
    try {
      const symbolPairs = this.buildTradingPair(baseSymbol);

      const data = await binance.prevDay(false);
      const mappingData = this.buildMappingSymbol(data);

      const result = symbolPairs.map((sym) => {
        if (mappingData[sym]) {
          return mappingData[sym];
        }
      });

      return result;
    } catch (err) {
      Logger.error(JSON.stringify(err), null, 'symbolMappingData');
    }
  }

  buildMappingSymbol(data) {
    const mapping = {};
    data.forEach((e) => {
      mapping[e.symbol] = e;
    });
    return mapping;
  }

  buildTradingPair(baseSymbol: string): string[] {
    return TRADING_CURRENCY.map((currency) => `${currency}${baseSymbol}`);
  }
}
