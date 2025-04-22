require('jest-extended');

jest.setTimeout(10000);

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

process.env = {
  ...process.env,
  DATABASE: 'mongodb://localhost:27017/test',
  PASSWORD: 'test_password',
  NODE_ENV: 'test',
}; 