---
name: arquitectura-software
description: Arquitectura de software para proyectos del equipo - levantar requisitos y atributos de calidad, elegir estilo (monolito modular, capas/hexagonal, eventos, microservicios), integración, datos, seguridad, despliegue, y documentarlo con C4, ADRs y diagramas. Úsalo al iniciar un proyecto, proponer o revisar una arquitectura, dividir un sistema o integrar sistemas.
---

# Arquitectura de software

Complementos (si están instalados): `documentation-and-adrs` (ADRs), `api-and-interface-design`
(contratos), `archify` / `mermaid` / `drawio` (diagramas), `bases-de-datos`, `security-and-hardening`,
`observability-and-instrumentation`.

## 1. Entender antes de diseñar
Escribe (o pregunta) en una página:
- **Problema y usuarios**: quién usa el sistema, qué hace, cuántos (hoy y en 2-3 años).
- **Atributos de calidad priorizados** (máximo 3-4 críticos), con escenarios medibles:
  rendimiento ("consulta de trámite < 1 s con 200 usuarios concurrentes"), disponibilidad, seguridad,
  mantenibilidad, interoperabilidad, costo, accesibilidad.
- **Restricciones**: stack del equipo, hosting/infraestructura disponible, presupuesto, plazos,
  normativa (datos personales, gobierno digital), sistemas existentes con los que integrar.
- **Capacidad del equipo**: cuántas personas y qué dominan. La mejor arquitectura es la que el equipo
  puede construir y operar.

## 2. Elegir estilo (de lo simple a lo complejo)
| Estilo | Úsalo cuando | Cuidado con |
|---|---|---|
| **Monolito modular** (por defecto) | un equipo, un despliegue, dominio mediano | límites entre módulos: cada módulo con su API interna y sus tablas |
| Capas / hexagonal (puertos y adaptadores) | dominio complejo o con muchas integraciones; lógica que debe testearse sin infraestructura | ceremonia innecesaria en CRUDs simples |
| Orientado a eventos / colas | procesos asíncronos, integraciones desacopladas, picos de carga | consistencia eventual, idempotencia, trazabilidad |
| Microservicios | varios equipos independientes, partes con escalado o ciclos de despliegue muy distintos | costo operativo alto (redes, observabilidad, datos distribuidos); casi nunca para un equipo pequeño |
| Serverless / funciones | tareas esporádicas o por eventos | arranque en frío, límites, lock-in |

Regla: empieza con monolito modular y extrae un servicio solo cuando un dato concreto lo justifique
(escala, equipo, despliegue, seguridad). Documenta esa decisión en un ADR.

## 3. Decisiones clave a cubrir
- **Datos**: un dueño por dato; motor por necesidad (skill `bases-de-datos`); nada de varios servicios
  escribiendo la misma tabla; respaldo y retención.
- **Integración**: síncrona (REST/JSON, contratos versionados) para consultas inmediatas; asíncrona
  (cola, eventos, patrón *outbox*) para procesos que pueden esperar o deben resistir caídas. Timeouts,
  reintentos con backoff e idempotencia en toda llamada externa.
- **Interoperabilidad con el Estado** (proyectos de gobierno): revisa los lineamientos vigentes de
  MinTIC (marco de interoperabilidad, Servicios Ciudadanos Digitales, plataforma X-Road) y los
  formatos de datos abiertos antes de diseñar integraciones con otras entidades.
- **Seguridad**: autenticación central (SSO/OIDC si hay varias apps), autorización en el servidor por
  rol y por recurso, secretos fuera del código, cifrado en tránsito y en reposo para datos sensibles,
  registro de auditoría. Referencia: OWASP ASVS nivel 2 para sistemas con datos personales.
- **Observabilidad**: logs estructurados con id de correlación, métricas básicas (latencia, errores,
  saturación), alertas y health checks.
- **Despliegue**: entornos (local, pruebas, producción) reproducibles; configuración por entorno
  (12-factor); CI con tests; migraciones automatizadas; plan de reversa.
- **Rendimiento y escala**: caché donde haya lecturas repetidas, paginación, trabajos pesados en colas;
  medir antes de optimizar.

## 4. Documentar (lo mínimo que sirve)
En `docs/arquitectura/` del proyecto:
1. `README.md` — contexto, atributos de calidad priorizados, restricciones, estilo elegido.
2. **Diagramas C4**: Contexto (el sistema y sus actores/sistemas externos) y Contenedores (apps, APIs,
   bases, colas). Componentes solo para las partes complejas. Mermaid para versionar en el repo;
   archify/draw.io cuando se necesite un diagrama para presentar.
   ```mermaid
   flowchart LR
     ciudadano([Ciudadano]) --> web[Portal web<br/>Laravel + Filament]
     funcionario([Funcionario]) --> web
     web --> db[(PostgreSQL)]
     web --> cola[[Cola de trabajos]]
     web -- REST --> sig[Sistema externo]
   ```
3. **ADRs** (`docs/adr/0001-titulo.md`): contexto, decisión, alternativas consideradas, consecuencias.
   Uno por decisión difícil de revertir (motor de BD, estilo, proveedor, autenticación).
4. Modelo de datos (diagrama ER) y contratos de API (OpenAPI) cuando existan.

## 5. Revisar una arquitectura existente
Checklist rápido: ¿hay un punto único de falla sin plan? ¿módulos que se llaman en círculo? ¿lógica
de negocio en controladores/vistas? ¿secretos en el repo? ¿consultas sin índice en tablas que crecen?
¿integraciones sin timeout/reintento? ¿sin respaldos probados? ¿sin logs útiles para diagnosticar?
Entrega hallazgos priorizados por riesgo e impacto, con la acción concreta.

## Errores frecuentes de agentes
- Proponer microservicios, Kubernetes o colas para un sistema que un monolito resuelve.
- Diseñar sin atributos de calidad ni restricciones explícitas.
- Diagramas que no coinciden con el código o que nadie actualiza.
- Decisiones importantes sin ADR (luego nadie sabe por qué se hizo así).
- Ignorar la operación: quién despliega, monitorea y restaura.

## Verificación
- Cada atributo de calidad crítico tiene al menos una decisión que lo atiende y una forma de medirlo.
- Los diagramas C4 y los ADRs están en el repo y coinciden con lo construido.
- Alguien del equipo que no participó en el diseño entiende el sistema leyendo `docs/arquitectura/`.
