import { ArgumentsHost, Catch, ExceptionFilter, HttpAdapterHost, NotFoundException, } from "@nestjs/common";

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const httpStatus = 404;
    const responseBody = { message: 'This endpoint was not found' };
    this.httpAdapterHost.httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}