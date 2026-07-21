import { HealthService } from '../src/modules/health/services/health.service';

describe('HealthService', () => {
  it('checks api and database status', async () => {
    const service = new HealthService({ $queryRaw: jest.fn() } as never);
    const result = await service.check();
    expect(result.api).toBe('ok');
    expect(result.database).toBe('ok');
  });
});
