import { HttpService, Injectable } from "@nestjs/common";
import * as cheerio from 'cheerio';
import * as moment from 'moment';

import { HolderBalanceHistoryWithStatistic } from "src/omatech-package/interface/holder.interface.";

@Injectable()
export class BTCGateway {
  bitinfochartUri = 'https://bitinfocharts.com';

  constructor(private httpService: HttpService) { 
    this.topHolders(100);
  }

  async topHolders(num: number): Promise<HolderBalanceHistoryWithStatistic[]> {
    let holders: HolderBalanceHistoryWithStatistic[] = [];
    const pageSize = 100;
    let page = 1;
    if (num <= pageSize) {
      const resp = await this.httpService.request({ url: `${this.bitinfochartUri}/top-100-richest-bitcoin-addresses-${page === 1 ? '' : page}.html`, method: 'POST' }).toPromise();
      holders = this.convertBTCHolders(resp.data);
      holders = holders.slice(0, num);
    } else {
      const totalPages = Number(Number(num / pageSize).toFixed());
      for (let i = 1; i <= totalPages; i++) {
        const resp = await this.httpService.request({ url: `${this.bitinfochartUri}/top-100-richest-bitcoin-addresses-${page === 1 ? '' : page}.html` }).toPromise();
        holders = [...holders, ...this.convertBTCHolders(resp.data)];
        page = page + 1;
      }
    }
    return holders;
  }

  convertBTCHolders(htmlString: string): HolderBalanceHistoryWithStatistic[] {
    const date = moment().second(0).millisecond(0).toDate();

    const $ = cheerio.load(htmlString);
    const rows1 = $('#tblOne > tbody > tr');
    const rows2 = $('#tblOne2 > tbody > tr');
    const rows = [...rows1, ...rows2];
    let data: HolderBalanceHistoryWithStatistic[] = [];
    for (let i = 0; i < rows.length; i++) {
      const cols = $(rows[i].children);
      const element = [];
      for (let i = 0; i < cols.length; i++) {
        element.push($(cols[i]).text());
      }
      // const element0 = $(element[0]);
      data.push({
        rank: Number(element[0]),
        address: $(cols[1]).children('a').text(),
        alias: $(cols[1]).children('small').text().replace('wallet: ', ''),
        balance: Number(
          String(String(element[2]).split(' BTC ')[0]).replace(/,/g, ''),
        ),
        share: Number(String(element[3]).replace('%', '')),
        txCount: isNaN(Number(element[6])) ? 0 : Number(element[6]),
        date,
        symbol: 'btc',
      });
    }
    // data = [...data, ...this._generateDataForTest(rows, $)];
    return data;
  }
}