import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ETHGateway } from './modules/blockchain/eth.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  const ethGateway = app.get(ETHGateway);
  ethGateway.topETHHolders(1000);
}
bootstrap();
