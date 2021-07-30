import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, Interval } from '@nestjs/schedule';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Model, } from 'mongoose';
import { StatisticTypes, HolderBalanceHistoryWithStatistic } from 'src/omatech-package/interface/holder.interface.';

import { ETHGateway } from '../blockchain/eth.gateway';
import { HolderBalanceHistory } from './holder.balance.histories.schema';
import { QueryObject } from 'src/omatech-package/interface';
import { BTCGateway } from '../blockchain/btc.gateway';
import { DOGEGateway } from '../blockchain/doge.gateway';
import { Holder } from './holder.schema';

@Injectable()
export class HolderService {
  constructor(
    @InjectModel(HolderBalanceHistory.name) private readonly balanceHistoryModel: Model<HolderBalanceHistory>,
    @InjectModel(Holder.name) private readonly holderModel: Model<Holder>,
    private readonly ethGateway: ETHGateway,
    private readonly btcGateway: BTCGateway,
    private readonly dogeGateway: DOGEGateway,
  ) {
    // this.balanceHistoryModel.deleteMany({}).then(console.log);
  }

  async create(data: any): Promise<HolderBalanceHistory> {
    const create = await this.balanceHistoryModel.create(data);
    return create;
  }

  async insertMany(data: any[]): Promise<Boolean> {
    const createdRows = await this.balanceHistoryModel.insertMany(data);
    return true;
  }

  async getLastestByDate(date: Date, { page, limit, symbol }: QueryObject): Promise<any[]> {
    let dataData = moment(date).minute(0).millisecond(0);
    let rows = [];
    let time = 1;
    while (rows.length <= 0 && time <= 10) {
      rows = await this.balanceHistoryModel.aggregate([
        {
          $match: {
            $and: [
              { date: moment(dataData).toDate() },
              { symbol: symbol }
            ]
          }
        },
        {
          $group: {
            _id: '$address',
            address: { $first: '$address' },
            alias: { $first: '$alias' },
            // rank: { $first: '$rank' },
            balance: { $first: '$balance' },
            share: { $first: '$share' },
            date: { $first: '$date' },
            symbol: { $first: '$symbol' }
          }
        },
        {
          $sort: {
            balance: -1,
          },
        },
        {
          $skip: (page - 1) * limit || 0,
        },
        {
          $limit: limit || 10,
        }
      ]);
      dataData.subtract('5', 'minute');
      time++;
    }
    return rows;
  };

  async getHolderStatistic(statisticTypes: StatisticTypes[], date: Date, { page, limit, symbol }: QueryObject): Promise<any[]> {
    let response = await this.getLastestByDate(date, { page, limit, symbol });
    if (response.length <= 0) return [];
    const inAddresses = _.map(response, (it) => it.address);
    if (statisticTypes.includes('1h')) {
      const oneHourStatistics = await this.getHolder1hStatistic(date, inAddresses, symbol);
      response.map((holderHis: HolderBalanceHistory, index: number) => {
        let oneHourStatistic = oneHourStatistics.find((it) => it.address === holderHis.address);
        if (oneHourStatistic) {
          response[index] = {
            ...response[index],
            change_1h: oneHourStatistic.change_1h
          };
        }
      });
    }
    if (statisticTypes.includes('24h')) {
      const fourtytwoStatistic = await this.getHolder24hStatistic(date, inAddresses, symbol);
      response.map((holderHis: HolderBalanceHistory, index: number) => {
        let dataStatistic = fourtytwoStatistic.find((it) => it.address === holderHis.address);
        if (dataStatistic) {
          response[index] = {
            ...response[index],
            change_24h: dataStatistic.change_24h
          };
        }
      });
    }
    if (statisticTypes.includes('7days')) {
      const sevenDayStatistic = await this.getHolder7DaysStatistic(date, inAddresses, symbol);
      response.map((holderHis: HolderBalanceHistory, index: number) => {
        let dataStatistic = sevenDayStatistic.find((it) => it.address === holderHis.address);
        if (dataStatistic) {
          response[index] = {
            ...response[index],
            change_7d: dataStatistic.change_7d
          };
        }
      });
    }
    if (statisticTypes.includes('30days')) {
      const thirdtyDayStatistic = await this.getHolder30DaysStatistic(date, inAddresses, symbol);
      response.map((holderHis: HolderBalanceHistory, index: number) => {
        let dataStatistic = thirdtyDayStatistic.find((it) => it.address === holderHis.address);
        if (dataStatistic) {
          response[index] = {
            ...response[index],
            change_30d: dataStatistic.change_30d
          };
        }
      });
    }
    return response;
  }

  async getHolder1hStatistic(date: Date, inAddresses: string[] = [], symbol): Promise<HolderBalanceHistoryWithStatistic[]> {
    const response = [];
    const momentFromTime = moment(date).minute(55).millisecond(0).subtract(1, 'hour').toDate();
    const momentEndTime = moment(date).minute(0).millisecond(0).toDate();
    const data = await this.balanceHistoryModel.aggregate([
      {
        $match: {
          $and: [
            { address: { $in: inAddresses } },
            { symbol }
          ]
        }
      },
      {
        $match: {
          '$or': [
            { date: { $eq: momentFromTime } },
            { date: { $eq: momentEndTime } }
          ]
        },
      },
      {
        $group: {
          _id: '$date',
          histories: { $push: { balance: '$balance', address: '$address', symbol: '$symbol', tokenAddress: '$tokenAddress', alias: '$alias', share: '$share', txCount: '$txCount' } },
        }
      },
      {
        $sort: {
          _id: -1,
        }
      },
    ]);
    const preStatistic = data.find((it) => moment(it._id).toISOString() === momentFromTime.toISOString());
    const currentStatistic = data.find((it) => moment(it._id).toISOString() === momentEndTime.toISOString());
    const preHistories = _.get(preStatistic, 'histories', []);
    const currenthistories = _.get(currentStatistic, 'histories', []);
    if (currenthistories.length > 0) {
      // Use data at end time
      currenthistories.map((history: HolderBalanceHistory) => {
        const preHistory = preHistories.find((it: HolderBalanceHistory) => it.address === history.address);
        response.push({
          ...history,
          change_1h: preHistory ? (((history.balance - preHistory.balance) / preHistory.balance)) * 100 : 0
        });
      });
    } else {
      // Use date at from time
      preHistories.map((history: HolderBalanceHistory) => {
        response.push({
          address: history.address,
          symbol: history.symbol,
          balance: history.balance,
          change_1h: 0
        });
      });
    }
    return response;
  }

  async getHolder24hStatistic(date: Date, inAddresses: string[] = [], symbol): Promise<HolderBalanceHistoryWithStatistic[]> {
    const response = [];
    const momentFromTime = moment(date).hour(23).minute(55).millisecond(0).subtract(1, 'day').toDate();
    const momentEndTime = moment(date).minute(0).millisecond(0).toDate();
    const data = await this.balanceHistoryModel.aggregate([
      {
        $match: {
          $and: [
            { address: { $in: inAddresses } },
            { symbol }
          ]
        }
      },
      {
        $match: {
          '$or': [
            { date: { $eq: momentFromTime } },
            { date: { $eq: momentEndTime } }
          ]
        },
      },
      {
        $group: {
          _id: '$date',
          histories: { $push: { balance: '$balance', address: '$address', symbol: '$symbol', tokenAddress: '$tokenAddress', alias: '$alias', share: '$share', txCount: '$txCount' } },
        }
      },
      {
        $sort: {
          _id: -1,
        }
      },
    ]);
    const preStatistic = data.find((it) => moment(it._id).toISOString() === momentFromTime.toISOString());
    const currentStatistic = data.find((it) => moment(it._id).toISOString() === momentEndTime.toISOString());
    const preHistories = _.get(preStatistic, 'histories', []);
    const currenthistories = _.get(currentStatistic, 'histories', []);
    if (currenthistories.length > 0) {
      // Use data at end time
      currenthistories.map((history: HolderBalanceHistory) => {
        const preHistory = preHistories.find((it: HolderBalanceHistory) => it.address === history.address);
        response.push({
          ...history,
          change_24h: preHistory ? (((history.balance - preHistory.balance) / preHistory.balance)) * 100 : 0
        });
      });
    } else {
      // Use date at from time
      preHistories.map((history: HolderBalanceHistory) => {
        response.push({
          address: history.address,
          balance: history.balance,
          change_24h: 0
        });
      });
    }
    return response;
  }

  async getHolder7DaysStatistic(date: Date, inAddresses: string[] = [], symbol): Promise<HolderBalanceHistoryWithStatistic[]> {
    const response = [];
    const momentFromTime = moment(date).hour(23).minute(55).millisecond(0).subtract(7, 'day').toDate();
    const momentEndTime = moment(date).minute(0).millisecond(0).toDate();
    const data = await this.balanceHistoryModel.aggregate([
      {
        $match: {
          $and: [
            { address: { $in: inAddresses } },
            { symbol }
          ]
        }
      },
      {
        $match: {
          '$or': [
            { date: { $eq: momentFromTime } },
            { date: { $eq: momentEndTime } }
          ]
        },
      },
      {
        $group: {
          _id: '$date',
          histories: { $push: { balance: '$balance', address: '$address', tokenAddress: '$tokenAddress', alias: '$alias', share: '$share', txCount: '$txCount' } },
        }
      },
      {
        $sort: {
          _id: -1,
        }
      },
    ]);
    const preStatistic = data.find((it) => moment(it._id).toISOString() === momentFromTime.toISOString());
    const currentStatistic = data.find((it) => moment(it._id).toISOString() === momentEndTime.toISOString());
    const preHistories = _.get(preStatistic, 'histories', []);
    const currenthistories = _.get(currentStatistic, 'histories', []);
    if (currenthistories.length > 0) {
      // Use data at end time
      currenthistories.map((history: HolderBalanceHistory) => {
        const preHistory = preHistories.find((it: HolderBalanceHistory) => it.address === history.address);
        response.push({
          ...history,
          change_7d: preHistory ? (((history.balance - preHistory.balance) / preHistory.balance)) * 100 : 0
        });
      });
    } else {
      // Use date at from time
      preHistories.map((history: HolderBalanceHistory) => {
        response.push({
          address: history.address,
          balance: history.balance,
          symbol: history.symbol,
          change_7d: 0
        });
      });
    }
    return response;
  }

  async getHolder30DaysStatistic(date: Date, inAddresses: string[] = [], symbol): Promise<HolderBalanceHistoryWithStatistic[]> {
    const response = [];
    const momentFromTime = moment(date).date(1).hour(23).minute(55).millisecond(0).subtract(30, 'day').toDate();
    const momentEndTime = moment(date).minute(0).millisecond(0).toDate();
    const data = await this.balanceHistoryModel.aggregate([
      { $match: { address: { $in: inAddresses }, symbol } },
      {
        $match: {
          '$or': [
            { date: { $eq: momentFromTime } },
            { date: { $eq: momentEndTime } }
          ]
        },
      },
      {
        $group: {
          _id: '$date',
          histories: { $push: { balance: '$balance', address: '$address', symbol: '$symbol', tokenAddress: '$tokenAddress', alias: '$alias', share: '$share', txCount: '$txCount' } },
        }
      },
      {
        $sort: {
          _id: -1,
        }
      },
    ]);
    const preStatistic = data.find((it) => moment(it._id).toISOString() === momentFromTime.toISOString());
    const currentStatistic = data.find((it) => moment(it._id).toISOString() === momentEndTime.toISOString());
    const preHistories = _.get(preStatistic, 'histories', []);
    const currenthistories = _.get(currentStatistic, 'histories', []);
    if (currenthistories.length > 0) {
      // Use data at end time
      currenthistories.map((history: HolderBalanceHistory) => {
        const preHistory = preHistories.find((it: HolderBalanceHistory) => it.address === history.address);
        response.push({
          ...history,
          change_30d: preHistory ? (((history.balance - preHistory.balance) / preHistory.balance)) * 100 : 0
        });
      });
    } else {
      // Use date at from time
      preHistories.map((history: HolderBalanceHistory) => {
        response.push({
          address: history.address,
          balance: history.balance,
          symbol: history.symbol,
          change_30d: 0
        });
      });
    }
    return response;
  }

  // @Cron('0 */5 * * * *')
  // @Interval(60 * 1000)
  async handleCron() {
    this.syncETHBalance();
    this.syncBTCBalance();
    this.syncDOGEBalance();
  }

  async syncETHBalance(): Promise<HolderBalanceHistoryWithStatistic[]> {
    const holders = await this.ethGateway.topETHHolders(1000);
    await this.balanceHistoryModel.insertMany(holders);
    console.log(`Sync ETH balances histories: ${holders.length} records`);
    return holders;
  }

  async syncBTCBalance(): Promise<HolderBalanceHistoryWithStatistic[]> {
    const holders = await this.btcGateway.topHolders(1000);
    await this.balanceHistoryModel.insertMany(holders);
    console.log(`Sync BTC balance histories: ${holders.length} records`);
    return holders;
  }

  async syncDOGEBalance(): Promise<HolderBalanceHistoryWithStatistic[]> {
    const holders = await this.dogeGateway.topHolders(1000);
    await this.balanceHistoryModel.insertMany(holders);
    console.log(`Sync DOGE balance histories: ${holders.length} records`);
    return holders;
  }

  async getTopHolders(symbol: string, options: QueryObject): Promise<Holder[]> {
    const holders = await this.holderModel.find({
      isDeleted: false,
      symbol: symbol.toLowerCase(),
    }).sort({ balanace: -1 }).skip((options.page - 1) * options.limit || 0).limit(options.limit);
    return holders;
  }

  async syncHolderData(holders: Holder[] | HolderBalanceHistoryWithStatistic[]): Promise<boolean> {
    for await (let holder of holders) {
      const result = await this.holderModel.findOneAndUpdate({ address: holder.address }, { ...holder });
      if (!result) {
        await this.holderModel.create({ ...holder });
      }
    }
    return true;
  }

  async getByAddresses(addresses: string[], symbol: string): Promise<Holder> {
    const holders = await this.holderModel.findOne({
      isDeleted: false,
      symbol: symbol.toLowerCase(),
      address: { $in: addresses }
    }).select('address alias');
    return holders;
  }
}
