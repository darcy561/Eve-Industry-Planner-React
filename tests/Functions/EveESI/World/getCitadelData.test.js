import { describe, it, expect, vi } from 'vitest';
import getCitadelData from '../../../../src/Functions/EveESI/World/getCitadelData';

describe('getCitadelData', () => {
  const validCharacter = { aToken: 'valid-token' };
  const citadelID = '123456789';

  it('should return an empty object if citadelID is missing', async () => {
    const result = await getCitadelData(null, validCharacter);
    expect(result).toEqual({});
  });

  it('should return error data if character is missing', async () => {
    const result = await getCitadelData(citadelID, null);
    expect(result).toEqual({
      id: citadelID,
      name: `No Access To Location - ${citadelID}`,
      unResolvedLocation: true,
    });
  });

  it('should return valid data when API response is successful', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ name: 'Test Citadel' }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await getCitadelData(citadelID, validCharacter);
    expect(result).toEqual({ id: citadelID, name: 'Test Citadel' });

    global.fetch.mockRestore();
  });

  it('should return error data when API response is unsuccessful', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await getCitadelData(citadelID, validCharacter);
    expect(result).toEqual({
      id: citadelID,
      name: `No Access To Location - ${citadelID}`,
      unResolvedLocation: true,
    });

    global.fetch.mockRestore();
  });

  it('should handle fetch failure and return error data', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await getCitadelData(citadelID, validCharacter);
    expect(result).toEqual({
      id: citadelID,
      name: `No Access To Location - ${citadelID}`,
      unResolvedLocation: true,
    });

    global.fetch.mockRestore();
  });
});

