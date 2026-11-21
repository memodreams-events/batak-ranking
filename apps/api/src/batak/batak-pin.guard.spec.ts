import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { BatakPinGuard } from './batak-pin.guard';

const contextWith = (headers: Record<string, string>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('BatakPinGuard', () => {
  const guard = new BatakPinGuard();
  const original = process.env.BATAK_PIN;

  afterEach(() => {
    if (original === undefined) delete process.env.BATAK_PIN;
    else process.env.BATAK_PIN = original;
  });

  it('deja pasar cualquier escritura si no hay PIN configurado', () => {
    delete process.env.BATAK_PIN;
    expect(guard.canActivate(contextWith({}))).toBe(true);
  });

  it('acepta el PIN correcto', () => {
    process.env.BATAK_PIN = '1234';
    expect(guard.canActivate(contextWith({ 'x-batak-pin': '1234' }))).toBe(true);
  });

  it('acepta el PIN con espacios alrededor (el iPad los cuela al pegar)', () => {
    process.env.BATAK_PIN = '1234';
    expect(guard.canActivate(contextWith({ 'x-batak-pin': ' 1234 ' }))).toBe(true);
  });

  it('rechaza un PIN incorrecto', () => {
    process.env.BATAK_PIN = '1234';
    expect(() => guard.canActivate(contextWith({ 'x-batak-pin': '9999' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza si no se manda la cabecera', () => {
    process.env.BATAK_PIN = '1234';
    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });
});
