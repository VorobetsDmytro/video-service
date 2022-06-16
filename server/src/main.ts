import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { NotFoundExceptionFilter } from './filters/not-found-exception.filter';
import * as path from 'path';

declare global {
  namespace Express {
      interface Request {
          user?: User | undefined;
      }
  }
}

const start = async () => {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {cors: true});
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe);
  const staticPath = path.resolve(__dirname, 'server', process.env.STATIC_PATH || 'static_path');
  app.useStaticAssets(staticPath);
  await app.listen(PORT, () => console.log(`The server has been started successfully on port: ${PORT}`));
}

start();