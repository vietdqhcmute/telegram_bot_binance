import { HttpService, Injectable } from '@nestjs/common';

import { Holder } from 'src/omatech-package/interface';
import { AssetTopHolders, NetworkTopHolders } from 'src/omatech-package/types';

@Injectable()
export class ETHGateway {
  coingeckoUri: string = 'https://api.coingecko.com/api/v3';

  constructor(private httpService: HttpService) { }

  /**
   * Get top holders
   * @param tokenAddress this value default is null for get top ETH holders
   * @param num 
   * @returns list of holders of the token or ETH
   */
  async getCoinInfo(coinID: string, num: number): Promise<any> {
    const tokenInfo = await this.httpService.get(`${this.coingeckoUri}/${coinID}`);
  }

  async getETHContractInfo(tokenAddress: string = null, num: number): Promise<any> {
  }
}