export interface Holder {
  rank: number;
  address: string;
  alias: string;
  balance: number;
  share: number;
  txCount: number;
  date: Date;
}

export interface QueryObject {
  page: number;
  limit: number;
  symbol?: string;
}