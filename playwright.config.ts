import { defineConfig, devices } from '@playwright/test'

/**
 * Leia a documentação: https://playwright.dev/docs/intro
 */
export default defineConfig({
  testDir: './e2e',
  /* Corra os testes em arquivos chamados e.g. "foo.test.ts" or "bar.test.ts" */
  testMatch: '**/*.e2e.ts',
  /* Execute os testes um de cada vez */
  fullyParallel: false,
  /* Falhe a compilação quando há console logs no teste */
  forbidOnly: !!process.env.CI,
  /* Retry em CI apenas */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter para usar. Veja https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  /* Configurações compartilhadas para todos os projetos de teste. Veja https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* URL base a ser usada em ações como `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Colete trace quando retry um teste com falha. Veja https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projetos para navegadores principais */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Teste contra navegadores mobile */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Teste contra navegadores com marca */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Execute seu servidor local antes de começar os testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
