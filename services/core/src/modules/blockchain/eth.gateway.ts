import { HttpService, Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as moment from 'moment';
import * as FormData from 'form-data';
import { ethers, providers, utils, BigNumber, Contract } from 'ethers';

import { Holder } from 'src/omatech-package/interface';
import { HolderBalanceHistoryWithStatistic } from 'src/omatech-package/interface/holder.interface.';
const erc20_abi = require('./ERC20.ABI.json');
@Injectable()
export class ETHGateway {
  private _provider: providers.BaseProvider;
  private _eth_network: string = 'homestead';

  constructor(private httpService: HttpService) {
    // this.topETHHolders(25).then((rs) => console.log(rs.length));
    this._provider = new ethers.providers.InfuraProvider(this._eth_network, 'bd0bb91141db41e686163ba0032c781e');
  }
  etherscanUri = 'https://etherscan.io';
  scanUri = 'https://api.etherscan.io';
  coingeckoUri = 'https://api.coingecko.com/api/v3';
  ethplorerUri = 'https://api.ethplorer.io';
  ethplorerKey = 'EK-jBNDi-W4HUWNq-q7q9A';
  /**
   * Get top holders
   * @param tokenAddress this value default is null for get top ETH holders
   * @param num
   * @returns list of holders of the token or ETH
   */
  async topETHHolders(num: number): Promise<HolderBalanceHistoryWithStatistic[]> {
    let holders: HolderBalanceHistoryWithStatistic[] = [];
    const pageSize = 25;
    let page = 1;
    try {
      if (num <= pageSize) {
        // const resp = await this.httpService.request({ url: `${this.etherscanUri}/accounts/${page}`, data: bodyFormData, method: 'POST' }).toPromise();
        const resp = await this.httpService.request({ url: `${this.etherscanUri}/accounts/${page}`, method: 'POST' }).toPromise();
        holders = this.convertETHHolders(resp.data);
        holders = holders.slice(0, num);
      } else {
        const totalPages = Number(Number(num / pageSize).toFixed());
        for (let i = 1; i <= totalPages; i++) {
          // const resp = await this.httpService.request({ url: `${this.etherscanUri}/accounts/${page}`, data: bodyFormData, method: 'POST' }).toPromise();
          const resp = await this.httpService.request({ url: `${this.etherscanUri}/accounts/${page}`, method: 'POST' }).toPromise();
          holders = [...holders, ...this.convertETHHolders(resp.data)];
          page = page + 1;
        }
      }
    } catch (err) {
      Logger.error(err.message, null, 'topETHHolders');
    }
    return holders;
  }

  /**
   * Get top holders
   * @param tokenAddress this value default is null for get top ETH holders
   * @param num
   * @returns list of holders of the token or ETH
   */
  async topTokenHolder(tokenAddress: string, num: number): Promise<Holder[]> {
    const resp = await this.httpService
      .get(
        `${this.ethplorerUri}/getTopTokenHolders/${tokenAddress}?apiKey=${this.ethplorerKey}&limit=${num}`,
      )
      .toPromise();
    return resp.data.holders;
  }

  /**
   *
   */
  convertETHHolders(htmlString: string): HolderBalanceHistoryWithStatistic[] {
    const date = moment().second(0).millisecond(0).toDate();

    const $ = cheerio.load(htmlString);
    const rows = $('table > tbody > tr');
    let data: HolderBalanceHistoryWithStatistic[] = [];
    for (let i = 0; i < rows.length; i++) {
      const cols = $(rows[i].children);
      const element = [];
      for (let i = 0; i < cols.length; i++) {
        element.push($(cols[i]).text());
      }
      data.push({
        rank: Number(element[0]),
        address: element[1],
        alias: element[2],
        balance: Number(
          String(element[3]).replace(' Ether', '').replace(/,/g, ''),
        ),
        share: Number(String(element[4]).replace('%', '')),
        txCount: isNaN(Number(element[5])) ? 0 : Number(element[5]),
        date,
        symbol: 'eth',
      });
    }
    // data = [...data, ...this._generateDataForTest(rows, $)];
    return data;
  }

  _generateDataForTest(rows: cheerio.Cheerio<any>, $): HolderBalanceHistoryWithStatistic[] {
    const data: HolderBalanceHistoryWithStatistic[] = [];
    let preHour = moment().second(0).millisecond(0).subtract(5, 'minute');
    for (let a = 1; a <= 288; a++) {
      for (let i = 0; i < rows.length; i++) {
        const cols = $(rows[i].children);
        const element = [];
        for (let i = 0; i < cols.length; i++) {
          element.push($(cols[i]).text());
        }
        data.push({
          rank: Number(element[0]),
          address: element[1],
          alias: element[2],
          balance: Number(
            String(element[3]).replace(' Ether', '').replace(/,/g, ''),
          ),
          share: Number(String(element[4]).replace('%', '')),
          txCount: isNaN(Number(element[5])) ? 0 : Number(element[5]),
          date: moment(preHour).toDate(),
          symbol: 'eth',
        });
      }
      preHour = moment(preHour).subtract(5, 'minute');
    }
    return data;
  }

  async eventListener(callback: Function = undefined): Promise<void> {
    this._provider.on('block', async (blockNumber: number) => {
      const { transactions } = await this._provider.getBlockWithTransactions(blockNumber);
      for await (const transaction of transactions) {
        try {
          const { from, to, value, hash, blockHash } = transaction;
          if (!to || Number(utils.formatEther(value)) === 0) {
            // Transaction to create contract  
            // console.log('Transaction create new contract')
            continue;
          }
          // Catch erc20 Transfer events
          // if (transaction.data && transaction.data != '0x' && transaction.data.startsWith('0xa9059cbb')) {
          //   const erc20Transaction = await this.decodeErc20Data(transaction.data, transaction.to);
          //   if (erc20Transaction) {
          //     // console.log(erc20Transaction, hash);
          //     callback && await callback({
          //       fromAddress: from,
          //       toAddress: erc20Transaction.to,
          //       amount: erc20Transaction.amount,
          //       txId: hash,
          //       blockHash: blockHash,
          //       status: 'SUCCESS',
          //       asset: erc20Transaction.asset,
          //     });
          //     // Logger.log(`Detect transfer from ${from.toLowerCase()} to ${to.toLowerCase()} ${utils.formatEther(value)} ${erc20Transaction.asset}`);
          //     continue;
          //   }
          // }
          // Callback implement
          callback && await callback({
            fromAddress: from.toLowerCase(),
            toAddress: to.toLowerCase(),
            amount: Number(utils.formatEther(value)),
            txId: hash,
            blockHash: blockHash,
            status: 'SUCCESS',
            asset: 'eth',
          });
          // Logger.log(`Detect transfer from ${from.toLowerCase()} to ${to.toLowerCase()} ${utils.formatEther(value)} eth`);
        } catch (err) {
          Logger.error(err.message, null, 'ProviderGetTransaction');
        }
      };
    });
  }

  async decodeErc20Data(data: string, token_address: string): Promise<{ to: string, amount: number, asset: string }> {
    try {
      let contract = new Contract(token_address, erc20_abi, this._provider);
      if (!contract) {
        return null;
      }
      const decimals = await contract.decimals();
      const to = data.replace('0xa9059cbb', '').substr(0, 64).substr(64 - 40, 40);
      const amount = data.replace('0xa9059cbb', '').substr(64, 128).substr(64 - 40, 40);
      return {
        to: `0x${to}`,
        amount: Number(utils.formatUnits(BigNumber.from(`0x${amount}`).toString(), decimals)),
        asset: await contract.symbol(),
      }
    } catch (err) {
      console.log(err.message);
      return null;
    }
  }
}
