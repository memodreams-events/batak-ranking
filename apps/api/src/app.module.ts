import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { BatakModule } from './batak/batak.module';
import { HealthController } from './health.controller';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    // La TV sondea cada 4 s y el iPad apunta a ráfagas: 100/min por IP sobra
    // para un stand y corta un bucle descontrolado.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    SupabaseModule,
    BatakModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Cerrado por defecto: solo pasa sin sesión lo marcado con @Public().
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
})
export class AppModule {}
