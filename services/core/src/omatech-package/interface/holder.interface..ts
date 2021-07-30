export type StatisticTypes = '1h' | '24h' | '7days' | '30days' | '60days';

export interface HolderBalanceHistoryWithStatistic {
  rank: number;
  address: string;
  alias: string;
  balance: number;
  share: number;
  txCount: number;
  date: Date;
  symbol: string;
  change_1h?: number;
  change_24h?: number;
  change_7d?: number;
  change_30d?: number;
}