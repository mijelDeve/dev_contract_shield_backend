# Agent Guidelines for DevContractShield Backend

## Project Overview

- **Framework**: NestJS with TypeScript
- **Testing**: Jest (unit tests `*.spec.ts`, e2e tests `*.e2e-spec.ts`)
- **Linting**: ESLint with typescript-eslint
- **Formatting**: Prettier

## Build, Lint, and Test Commands

### Development

```bash
npm run start          # Start the application
npm run start:dev     # Start with watch mode
npm run start:debug    # Start with debugging
npm run start:prod     # Run production build from dist/
npm run build          # Compile TypeScript to dist/
```

### Linting & Formatting

```bash
npm run lint           # Run ESLint with auto-fix
npm run format         # Format code with Prettier
```

### Testing

```bash
npm run test           # Run all unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

### Running a Single Test

```bash
npm test -- src/app.controller.spec.ts                    # Run specific file
npm test -- --testNamePattern="root"                      # Run by pattern
npm run test:watch -- --testPathPattern="app.controller" # Watch mode
```

## Code Style Guidelines

### Imports

- Use absolute imports from `@nestjs/common`, `@nestjs/core`
- Use relative imports for local files (`./module`, `../types`)
- Group: external → NestJS → local modules

### Naming Conventions

| Element           | Convention               | Example                    |
| ----------------- | ------------------------ | -------------------------- |
| Files             | kebab-case               | `user-service.ts`          |
| Classes           | PascalCase               | `AppController`            |
| Interfaces/DTOs   | PascalCase (no I prefix) | `UserDto`, `CreateUserDto` |
| Methods/Functions | camelCase                | `getUserById()`            |
| Variables         | camelCase                | `userId`, `isActive`       |
| Constants         | SCREAMING_SNAKE_CASE     | `MAX_RETRY_COUNT`          |

### Decorators (NestJS)

- `@Injectable()`, `@Controller()`, `@Module()`, `@Catch()`, `@Guard()`
- Method: `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- Parameter: `@Body()`, `@Param()`, `@Query()`, `@Headers()`

### Type Annotations

- **Avoid `any`**: Use specific types or `unknown`
- Handle null/undefined with `strictNullChecks`
- Use interfaces for objects, types for unions/intersections

### Error Handling

- Use NestJS exceptions: `NotFoundException`, `BadRequestException`, etc.
- Handle async errors with try/catch or `.catch()`

```typescript
async findOne(id: string) {
  const user = await this.userRepository.findOne(id);
  if (!user) throw new NotFoundException(`User #${id} not found`);
  return user;
}
```

### Prettier Config

```json
{ "singleQuote": true, "trailingComma": "all" }
```

- Use single quotes, trailing commas, 2-space indentation

### File Organization

```
src/
├── main.ts              # Entry point
├── app.module.ts        # Root module
├── controllers/         # HTTP handlers
├── services/            # Business logic (@Injectable)
├── dto/                 # Data Transfer Objects
├── entities/            # Database entities
├── guards/              # Route guards
├── filters/             # Exception filters
└── decorators/          # Custom decorators
```

### Module Structure

```typescript
@Module({
  imports: [
    /* dependent modules */
  ],
  controllers: [
    /* controllers */
  ],
  providers: [
    /* services */
  ],
  exports: [
    /* exported services */
  ],
})
export class FeatureModule {}
```

### Testing Conventions

Unit tests (`*.spec.ts`):

```typescript
describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

E2E tests: Place in `test/` directory, use supertest for HTTP assertions.

## ESLint Rules

- `@typescript-eslint/no-explicit-any`: OFF
- `@typescript-eslint/no-floating-promises`: WARN
- `@typescript-eslint/no-unsafe-argument`: WARN
- `prettier/prettier`: ERROR

## TypeScript Config

- `target`: ES2023, `experimentalDecorators`: true, `emitDecoratorMetadata`: true
- `strictNullChecks`: true, `esModuleInterop`: true

## Best Practices

1. Use constructor injection, avoid circular dependencies
2. Validate input with class-validator DTOs
3. Return `Promise` for single values, `Observable` for streams
4. Use `@nestjs/config` for environment variables
5. Validate all input, sanitize output, use guards for auth
