import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EXTRA_MODELS } from './extra-models';

type DocProperties = { title: string; version: string };

export function setupSwagger(
  docProperties: DocProperties,
  app: INestApplication,
) {
  const config = new DocumentBuilder()
    .setTitle(docProperties.title || 'Documentation')
    .setVersion(docProperties.version || '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: EXTRA_MODELS,
  });

  SwaggerModule.setup('/docs', app, document, {
    customSiteTitle: docProperties.title || 'Documentation',
    customCss: `
      :root {
        --bg: #0f0f0f;
        --bg2: #191919;
        --panel: #121212;
        --border: #3b3b3b;
        --text: #d1d1d1;
        --muted: #b3b3b3;
      }
      html, body, .swagger-ui { background-color: var(--bg) !important; color: var(--text) !important; }
      .swagger-ui a { color: var(--text) !important; }
      .swagger-ui .scheme-container,
      .swagger-ui .information-container { background-color: var(--bg) !important; }
      .swagger-ui input,
      .swagger-ui textarea,
      .swagger-ui select { background: var(--panel) !important; color: var(--text) !important;}
      .swagger-ui textarea::placeholder { color: var(--muted) !important; }
      .swagger-ui .opblock { background: var(--bg2) !important; border-color: var(--border) !important; }
      .swagger-ui .opblock-section-header { background: var(--bg2) !important;  }
      `,
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      docExpansion: 'none',
    },
  });
}
