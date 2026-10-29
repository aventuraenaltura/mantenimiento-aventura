-- =====================================================
-- MIGRACIÓN: Estado PENDIENTE en registros de mantenimiento
-- Ejecutar UNA vez en: Supabase → SQL Editor
-- Los registros existentes quedan como 'realizado'.
-- =====================================================

alter table ejecuciones add column if not exists estado text default 'realizado';
alter table ejecuciones add column if not exists pendiente_nota text;      -- qué quedó por hacer (se guarda al completarlo)
alter table ejecuciones add column if not exists completado_fecha text;    -- cuándo se completó el pendiente
alter table ejecuciones add column if not exists completado_por text;      -- quién lo completó

update ejecuciones set estado = 'realizado' where estado is null;
