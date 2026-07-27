import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const routeDecoratorPattern = /^\s*@(?:Get|Post|Patch|Put|Delete)\(/;
const pathParamPattern = /['"`][^'"`]*:([A-Za-z0-9_]+)/;

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
});
