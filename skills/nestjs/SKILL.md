---
name: nestjs
description: NestJS (10/11) - módulos, controladores, providers, DTOs con validación, guards, ORM (Prisma/TypeORM), configuración, errores y testing. Úsalo al crear o modificar una API NestJS.
---

# NestJS

## Antes de empezar
- Versión de `@nestjs/core` (11 usa Express 5 por defecto), plataforma (Express o Fastify), ORM
  (Prisma, TypeORM, MikroORM, Mongoose) y auth existentes. Sigue lo que el proyecto ya usa.
- Genera con el CLI para respetar estructura y registrar en módulos:
  `npx nest g resource users` (o `g module|controller|service users`).
- Aplica también el skill `nodejs`.

## Estructura
```
src/
  main.ts                 # bootstrap: pipes, CORS, prefix, versioning, swagger
  app.module.ts
  config/                 # ConfigModule + validación de env
  common/                 # filtros, guards, interceptores, decoradores compartidos
  users/
    users.module.ts  users.controller.ts  users.service.ts
    dto/create-user.dto.ts  dto/update-user.dto.ts
    entities/user.entity.ts
```
- Un módulo por dominio. Exporta solo los providers que otros módulos necesitan. Evita dependencias
  circulares (si aparece `forwardRef`, replantea el diseño).

## Controladores delgados, servicios con la lógica
```ts
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id);
  }
}
```
- Inyección por constructor con `private readonly`. Nada de `new Service()`.

## Validación
```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
```
```ts
export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```
- DTOs para toda entrada; nunca aceptes la entidad directamente.
- Respuestas: no devuelvas campos sensibles (password hash) → serializa con `class-transformer`
  (`@Exclude`) + `ClassSerializerInterceptor`, o mapea a un DTO de respuesta.

## Configuración
- `ConfigModule.forRoot({ isGlobal: true, validate })` con esquema (zod/Joi/class-validator).
  Inyecta `ConfigService`; no leas `process.env` disperso.

## Errores
- Lanza excepciones HTTP de Nest (`NotFoundException`, `ConflictException`, `ForbiddenException`)
  desde servicios o traduce errores de dominio en un `ExceptionFilter` global.
- Errores del ORM (p. ej. Prisma `P2002` unique) → mapea a 409 en un filtro, no los dejes en 500.

## Auth
- Guards (`@UseGuards(JwtAuthGuard, RolesGuard)`) + decorador `@Roles()`; guard global con
  `@Public()` para excepciones es un buen patrón.
- Passport/JWT o el que use el proyecto. Hash con argon2/bcrypt. Rate limiting con `@nestjs/throttler`.

## Datos
- Prisma: un `PrismaService` (extiende `PrismaClient`, `onModuleInit` → `$connect`) en un módulo global.
- TypeORM: repositorios con `@InjectRepository`; migraciones, nunca `synchronize: true` en producción.
- Transacciones para operaciones multi-tabla. Paginación en listados.

## Documentación
- `@nestjs/swagger`: `@ApiTags`, DTOs documentados (el plugin del CLI infiere tipos). Swagger en
  `/docs` fuera de producción o protegido.

## Testing
- Unit: `Test.createTestingModule({ providers: [UsersService, { provide: PrismaService, useValue: mock }] })`.
- E2E: Supertest contra `app.getHttpServer()` con DB de pruebas.

## Errores frecuentes de agentes
- Olvidar registrar el provider/controlador en el módulo o importar el módulo que lo exporta.
- Lógica de negocio en controladores. DTOs sin decoradores (la validación no corre).
- `synchronize: true` en producción. Devolver entidades con datos sensibles.
- Circularidad entre módulos resuelta con `forwardRef` en vez de rediseñar.

## Verificación
- `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`; levanta con `npm run start:dev` y
  prueba un endpoint.
