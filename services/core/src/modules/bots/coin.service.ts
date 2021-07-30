import { HttpService, Injectable } from '@nestjs/common';
import * as _ from 'lodash';

@Injectable()
export class CoinsService {
  private _endpointEthExplore: string = 'https://api.ethplorer.io';
  private _tokenEthExplore = 'EK-gx3jN-d8vddb7-15w5j';
  private _coingekcoUri = 'https://api.coingecko.com/api/v3';
  constructor(
    private readonly httpService: HttpService,
  ) {
  }

  async getErc20PriceByAddressV2(address: string): Promise<number> {
    try {
      const response = await this.httpService.get(`${this._endpointEthExplore}/getTokenInfo/${address}?apiKey=${this._tokenEthExplore}`).toPromise();
      return _.get(response, `data.price.rate`, 0);
    } catch (err) {
      return 0;
    }
  }

  async getPrice(coinID: string): Promise<number> {
    try {
      const response = await this.httpService.get(`${this._coingekcoUri}/simple/price/?ids=${coinID}&vs_currencies=usd`).toPromise();
      return _.get(response, `data.${coinID}.usd`, 0);
    } catch (err) {
      return 0;
    }
  }
}