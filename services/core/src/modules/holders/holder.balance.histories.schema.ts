import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v1 as uuidv1 } from 'uuid';
import { Document } from 'mongoose';

@Schema()
export class HolderBalanceHistory extends Document {
  @Prop({
    default: uuidv1,
  })
  ID: string;

  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true, default: 0 })
  rank: number;

  @Prop({ required: true })
  address: string;

  @Prop({ required: false })
  tokenAddress: string;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: false })
  alias: string;

  @Prop({ required: true, default: 0 })
  share: number;

  @Prop({ required: true, default: 0 })
  txCount: number;

  @Prop({ required: false })
  date: Date;
  
  // @Prop({ required: true, default: 0 })
  // time: string;
}

const HolderBalanceHistorySchema = SchemaFactory.createForClass(HolderBalanceHistory).index({ tokenAddress: 1, address: 1, date: 1 }, { unique: true });
export { HolderBalanceHistorySchema };
