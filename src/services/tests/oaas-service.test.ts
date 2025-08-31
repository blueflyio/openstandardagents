import { OAASService } from '../src/index';

describe('OAASService', () => {
  let service: OAASService;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = global.testUtils.createMockConfig();
    service = new OAASService(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(service).toBeInstanceOf(OAASService);
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        new OAASService({} as any);
      }).toThrow();
    });
  });

  describe('discoverAgents', () => {
    it('should discover agents successfully', async () => {
      const agents = await service.discoverAgents();
      expect(Array.isArray(agents)).toBe(true);
    });

    it('should return empty array when no agents found', async () => {
      // Mock empty discovery
      jest.spyOn(service as any, 'discovery', 'get').mockReturnValue({
        discoverAll: jest.fn().mockResolvedValue([])
      });

      const agents = await service.discoverAgents();
      expect(agents).toEqual([]);
    });
  });

  describe('executeCapability', () => {
    it('should execute capability successfully', async () => {
      const mockAgent = global.testUtils.createMockAgent();
      
      // Mock the registry to return our test agent
      jest.spyOn(service as any, 'registry', 'get').mockReturnValue({
        getAgent: jest.fn().mockResolvedValue(mockAgent)
      });

      const result = await service.executeCapability('test-agent', 'test-capability', {});
      expect(result).toBeDefined();
    });

    it('should throw error for non-existent agent', async () => {
      jest.spyOn(service as any, 'registry', 'get').mockReturnValue({
        getAgent: jest.fn().mockResolvedValue(null)
      });

      await expect(
        service.executeCapability('non-existent', 'capability', {})
      ).rejects.toThrow();
    });
  });

  describe('getAgentForFramework', () => {
    it('should return agent for specified framework', async () => {
      const mockAgent = global.testUtils.createMockAgent();
      
      jest.spyOn(service as any, 'registry', 'get').mockReturnValue({
        getAgent: jest.fn().mockResolvedValue(mockAgent)
      });

      const result = await service.getAgentForFramework('test-agent', 'langchain');
      expect(result).toBeDefined();
    });
  });

  describe('validateAgents', () => {
    it('should validate agents successfully', async () => {
      const result = await service.validateAgents();
      expect(result).toBeDefined();
    });
  });

  describe('getAgentRegistry', () => {
    it('should return agent registry', async () => {
      const registry = await service.getAgentRegistry();
      expect(Array.isArray(registry)).toBe(true);
    });
  });
});
