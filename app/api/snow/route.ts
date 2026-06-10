import { NextResponse } from 'next/server'
import { buildSnowOpenApiSpec } from '@/lib/snow/openapi'

export const runtime = 'nodejs'

function swaggerHtml(origin: string) {
  const specJson = JSON.stringify(buildSnowOpenApiSpec(origin))

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API SNOW - Inventário CRC</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      :root {
        color-scheme: light;
        --snow-bg: #f8fafc;
        --snow-panel: #ffffff;
        --snow-border: #dbe3ef;
        --snow-text: #172033;
        --snow-muted: #5b677a;
        --snow-blue: #2563eb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--snow-bg);
        color: var(--snow-text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body::before {
        content: "API SNOW - Inventário CRC";
        display: block;
        padding: 18px 32px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: .01em;
        border-bottom: 1px solid #1e293b;
      }
      .topbar { display: none; }
      #swagger-ui {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 28px 48px;
      }
      .swagger-ui {
        color: var(--snow-text);
      }
      .swagger-ui .wrapper {
        max-width: none;
        padding: 0;
      }
      .swagger-ui .info {
        margin: 0 0 20px;
        padding: 22px 24px;
        border: 1px solid var(--snow-border);
        border-radius: 10px;
        background: var(--snow-panel);
        box-shadow: 0 1px 2px rgba(15, 23, 42, .05);
      }
      .swagger-ui .info .title {
        color: var(--snow-text);
        font-size: 28px;
      }
      .swagger-ui .info .title small {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .swagger-ui .info .description,
      .swagger-ui .info p,
      .swagger-ui .opblock-description-wrapper p,
      .swagger-ui .opblock-external-docs-wrapper p,
      .swagger-ui .opblock-title_normal p {
        color: var(--snow-muted);
      }
      .swagger-ui .scheme-container {
        margin: 0 0 20px;
        padding: 16px 20px;
        border: 1px solid var(--snow-border);
        border-radius: 10px;
        background: var(--snow-panel);
        box-shadow: 0 1px 2px rgba(15, 23, 42, .05);
      }
      .swagger-ui .auth-wrapper .authorize {
        border-color: var(--snow-blue);
        color: var(--snow-blue);
      }
      .swagger-ui .auth-wrapper .authorize svg {
        fill: var(--snow-blue);
      }
      .swagger-ui .opblock-tag {
        margin: 16px 0 10px;
        padding: 12px 16px;
        border: 1px solid var(--snow-border);
        border-radius: 10px;
        background: #eef4ff;
        color: #1e293b;
      }
      .swagger-ui .opblock {
        margin: 0 0 12px;
        border-radius: 10px;
        box-shadow: none;
        border-color: var(--snow-border);
        overflow: hidden;
      }
      .swagger-ui .opblock .opblock-summary {
        padding: 12px 16px;
      }
      .swagger-ui .opblock .opblock-summary-path,
      .swagger-ui .opblock .opblock-summary-path__deprecated {
        color: #111827;
        font-weight: 700;
      }
      .swagger-ui .opblock .opblock-summary-description {
        color: #475569;
      }
      .swagger-ui .opblock.opblock-get {
        background: #eff6ff;
        border-color: #bfdbfe;
      }
      .swagger-ui .opblock.opblock-post {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }
      .swagger-ui .opblock.opblock-post .opblock-summary-method {
        background: #16a34a;
      }
      .swagger-ui .opblock.opblock-get .opblock-summary-method {
        background: #2563eb;
      }
      .swagger-ui .opblock-body {
        background: #ffffff;
      }
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th {
        color: #334155;
        border-bottom-color: var(--snow-border);
      }
      .swagger-ui .parameters-col_description,
      .swagger-ui .parameter__name,
      .swagger-ui .parameter__type,
      .swagger-ui .response-col_status,
      .swagger-ui .response-col_description,
      .swagger-ui .model-title,
      .swagger-ui .model,
      .swagger-ui .prop-format,
      .swagger-ui .property,
      .swagger-ui .renderedMarkdown,
      .swagger-ui .tab li,
      .swagger-ui label {
        color: var(--snow-text);
      }
      .swagger-ui input,
      .swagger-ui textarea,
      .swagger-ui select {
        border-color: #cbd5e1;
        border-radius: 8px;
        color: #111827;
      }
      .swagger-ui .btn {
        border-radius: 8px;
      }
      .swagger-ui .btn.execute {
        background-color: var(--snow-blue);
        border-color: var(--snow-blue);
      }
      .swagger-ui .highlight-code,
      .swagger-ui .microlight,
      .swagger-ui pre {
        background: #0f172a !important;
        color: #e2e8f0 !important;
      }
      .fallback {
        display: none;
        padding: 16px;
        background: var(--snow-bg);
        color: var(--snow-text);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .fallback a { color: var(--snow-blue); }
      @media (max-width: 768px) {
        body::before { padding: 14px 18px; }
        #swagger-ui { padding: 16px 12px 32px; }
        .swagger-ui .info { padding: 16px; }
        .swagger-ui .info .title { font-size: 22px; }
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <div class="fallback">
      <h1>API SNOW - Inventário CRC</h1>
      <p>Swagger UI não carregou. A especificação OpenAPI está disponível em <a href="/api/snow?format=json">/api/snow?format=json</a>.</p>
    </div>
    <script>
      window.__SNOW_OPENAPI__ = ${specJson};
      window.setTimeout(function () {
        if (!document.querySelector('.swagger-ui')) {
          document.querySelector('.fallback').style.display = 'block';
        }
      }, 3000);
    </script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          spec: window.__SNOW_OPENAPI__,
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)

  if (searchParams.get('format') === 'json') {
    return NextResponse.json(buildSnowOpenApiSpec(origin))
  }

  return new NextResponse(swaggerHtml(origin), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}
