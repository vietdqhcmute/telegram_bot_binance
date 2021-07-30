import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v1 as uuidv1 } from 'uuid';
import { Document } from 'mongoose';
import { BotEventListerTypes } from 'src/omatech-package/types';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Schema()
export class Follower extends Document {
  @Prop({
    default: uuidv1,
  })
  ID: string;

  @Prop({ required: true })
  chatID: string;

  @Prop({ required: true, default: [] })
  listenTypes: BotEventListerTypes[];

  @Prop({ required: true, default: false })
  isDeleted: Boolean;

  @Prop({ required: false })
  lastestSent: Date;
}

const FollowerSchema = SchemaFactory.createForClass(Follower);
FollowerSchema.plugin(mongoosePaginate);
export { FollowerSchema };
