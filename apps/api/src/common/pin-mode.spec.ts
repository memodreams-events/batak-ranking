import { assertPinModeIsSafe, isPinRequired } from './pin-mode';

describe('pin-mode', () => {
  const pin = process.env.BATAK_PIN;
  const env = process.env.NODE_ENV;

  afterEach(() => {
    if (pin === undefined) delete process.env.BATAK_PIN;
    else process.env.BATAK_PIN = pin;
    process.env.NODE_ENV = env;
  });

  it('isPinRequired ignora un PIN que solo tiene espacios', () => {
    process.env.BATAK_PIN = '   ';
    expect(isPinRequired()).toBe(false);
  });

  it('en producción sin PIN se niega a arrancar', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BATAK_PIN;
    expect(() => assertPinModeIsSafe()).toThrow(/BATAK_PIN/);
  });

  it('en producción con PIN arranca', () => {
    process.env.NODE_ENV = 'production';
    process.env.BATAK_PIN = '1234';
    expect(() => assertPinModeIsSafe()).not.toThrow();
  });

  it('en local sin PIN arranca', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.BATAK_PIN;
    expect(() => assertPinModeIsSafe()).not.toThrow();
  });
});
