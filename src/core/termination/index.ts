import { INestApplication, Logger } from '@nestjs/common';
import HttpTerminator from 'lil-http-terminator';

export const enableGracefulTermination = (app: INestApplication) => {
  const terminator = HttpTerminator({
    server: app.getHttpServer(),
    gracefulTerminationTimeout: 60000,
    maxWaitTimeout: 60000,
  });

  const shutdown = () => {
    void (async () => {
      const { success, message, error } = await terminator.terminate();

      if (!success) {
        Logger.error('Shutdown error');
        Logger.error(message, error);
      } else {
        Logger.log('Server gracefully terminated');
      }

      await app.close();
      process.exit(0);
    })();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
