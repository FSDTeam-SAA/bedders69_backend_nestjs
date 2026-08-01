import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiOperation, ApiTags, SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './config/api-docs';

const routeDecoratorPattern = /^\s*@(?:Get|Post|Patch|Put|Delete)\(/;
const pathParamPattern = /['"`][^'"`]*:([A-Za-z0-9_]+)/;
const apiTagPattern = /@ApiTags\('([^']+)'\)/g;
const configuredTagPattern = /\[\s*'([^']+)'\s*,/g;

const getControllerFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) return getControllerFiles(fullPath);
      return fullPath.endsWith('.controller.ts') ? [fullPath] : [];
    })
    .sort();
};

@ApiTags('Docs Probe')
@Controller('docs-probe')
class DocsProbeController {
  @Get()
  @ApiOperation({ summary: 'Probe generated OpenAPI path prefix handling' })
  find() {
    return { ok: true };
  }
}

describe('OpenAPI documentation coverage', () => {
  const moduleDir = join(process.cwd(), 'src/app/module');
  const controllerFiles = getControllerFiles(moduleDir);

  it('has controller files to inspect', () => {
    expect(controllerFiles.length).toBeGreaterThan(0);
  });

  it.each(controllerFiles)(
    '%s documents every route for Scalar/OpenAPI',
    (filePath) => {
      const source = readFileSync(filePath, 'utf8');
      const lines = source.split('\n');
      const routeIndexes = lines
        .map((line, index) => (routeDecoratorPattern.test(line) ? index : -1))
        .filter((index) => index >= 0);

      expect(source).toContain('@ApiTags(');

      routeIndexes.forEach((routeIndex, routePosition) => {
        const nextRouteIndex = routeIndexes[routePosition + 1] ?? lines.length;
        const routeBlock = lines.slice(routeIndex, nextRouteIndex).join('\n');
        const routeLine = lines[routeIndex];
        const routeName = `${relative(process.cwd(), filePath)}:${routeIndex + 1}`;

        expect(routeBlock).toContain('@ApiOperation(');

        const pathParam = routeLine.match(pathParamPattern)?.[1];
        if (pathParam) {
          expect(routeBlock).toContain(`name: '${pathParam}'`);
          expect(routeBlock).toContain('@ApiParam(');
        }

        if (routeBlock.includes('@Query(')) {
          expect(routeBlock).toContain('@ApiQuery(');
        }

        if (routeBlock.includes('@Body(')) {
          expect(routeBlock).toContain('@ApiBody(');
        }

        if (routeBlock.includes('@UseGuards(')) {
          expect(routeBlock).toContain("@ApiBearerAuth('access-token')");
        }

        expect(routeName).toBeTruthy();
      });
    },
  );

  it('keeps Scalar URLs from duplicating the global API prefix', () => {
    const docsConfigSource = readFileSync(
      join(process.cwd(), 'src/app/config/api-docs.ts'),
      'utf8',
    );
    const mainSource = readFileSync(join(process.cwd(), 'src/main.ts'), 'utf8');

    expect(docsConfigSource).toContain('.addServer(API_BASE_PATH');
    expect(mainSource).toContain('ignoreGlobalPrefix: true');
  });

  it('generates Scalar-ready paths without duplicating /api/v1', async () => {
    let app: INestApplication | undefined;

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [DocsProbeController],
      }).compile();
      app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();

      const document = SwaggerModule.createDocument(
        app,
        createSwaggerConfig(),
        {
          ignoreGlobalPrefix: true,
        },
      );

      expect(document.servers?.[0]?.url).toBe('/api/v1');
      expect(document.paths['/docs-probe']).toBeDefined();
      expect(document.paths['/api/v1/docs-probe']).toBeUndefined();
    } finally {
      await app?.close();
    }
  });

  it('describes every controller tag in the top-level OpenAPI config', () => {
    const docsConfigSource = readFileSync(
      join(process.cwd(), 'src/app/config/api-docs.ts'),
      'utf8',
    );
    const configuredTags = new Set(
      [...docsConfigSource.matchAll(configuredTagPattern)].map(
        (match) => match[1],
      ),
    );

    const controllerTags = new Set<string>();
    controllerFiles.forEach((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      [...source.matchAll(apiTagPattern)].forEach((match) => {
        controllerTags.add(match[1]);
      });
    });

    controllerTags.forEach((tag) => {
      expect(configuredTags).toContain(tag);
    });
  });
});
