// getStationData.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import getStationData from '../../../../src/Functions/EveESI/World/getStationData';

// Mocking fetch
const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  global.fetch = mockFetch;
});

describe('getStationData', () => {
  it('should retrieve station data successfully', async () => {
    const stationID = 60003760;
    const mockResponse = {
      station_id: stationID,
      name: 'Jita',
      // other station data
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getStationData(stationID);

    expect(result).toEqual(mockResponse);
  });

  it('should handle missing stationID and return null', async () => {
    const result = await getStationData(null);
    expect(result).toBeNull();
  });

  it('should handle invalid input types and return null', async () => {
    const invalidInputs = [true, [], {}, () => {}, Symbol('symbol')];

    for (const input of invalidInputs) {
      const result = await getStationData(input);
      expect(result).toBeNull();
    }
  });

  it('should handle API errors and return null', async () => {
    const stationID = 60003760;

    // Simulate API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await getStationData(stationID);
    expect(result).toBeNull();
  });

  it('should handle network errors and return null', async () => {
    const stationID = 60003760;

    // Simulate network error
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));

    const result = await getStationData(stationID);
    expect(result).toBeNull();
  });
});
