/**
 * Tests for OSSA Error Codes
 */

import {
  OSSAErrorCode,
  ERROR_CATALOG,
  getErrorDetails,
  searchErrorsByTag,
  searchErrorsBySeverity,
  getAllErrorCodes,
  getErrorCountBySeverity,
} from '../error-codes';

describe('Error Codes', () => {
  describe('OSSAErrorCode enum', () => {
    it('should have 101 error codes', () => {
      const codes = Object.values(OSSAErrorCode);
      expect(codes.length).toBe(101);
    });

    it('should have correct format (OSSA-XXX)', () => {
      const codes = Object.values(OSSAErrorCode);
      codes.forEach((code) => {
        expect(code).toMatch(/^OSSA-\d{3}$/);
      });
    });

    it('should have sequential codes', () => {
      expect(OSSAErrorCode.OSSA_001).toBe('OSSA-001');
      expect(OSSAErrorCode.OSSA_100).toBe('OSSA-100');
      expect(OSSAErrorCode.OSSA_200).toBe('OSSA-200');
      expect(OSSAErrorCode.OSSA_906).toBe('OSSA-906');
    });
  });

  describe('ERROR_CATALOG', () => {
    it('should have entry for every error code', () => {
      const codes = Object.values(OSSAErrorCode);
      codes.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
        expect(ERROR_CATALOG[code].code).toBe(code);
      });
    });

    it('should have required fields for all errors', () => {
      Object.values(ERROR_CATALOG).forEach((error) => {
        expect(error.code).toBeDefined();
        expect(error.severity).toMatch(/^(error|warning|info)$/);
        expect(error.message).toBeDefined();
        expect(error.remediation).toBeDefined();
        expect(error.docsUrl).toBeDefined();
        expect(error.docsUrl).toContain('openstandardagents.org');
      });
    });

    it('should have tags for all errors', () => {
      Object.values(ERROR_CATALOG).forEach((error) => {
        expect(error.tags).toBeDefined();
        expect(Array.isArray(error.tags)).toBe(true);
        expect(error.tags!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getErrorDetails', () => {
    it('should return error details for valid code', () => {
      const details = getErrorDetails(OSSAErrorCode.OSSA_001);
      expect(details).toBeDefined();
      expect(details!.code).toBe(OSSAErrorCode.OSSA_001);
      expect(details!.message).toBe('Missing required field');
      expect(details!.severity).toBe('error');
    });

    it('should return undefined for invalid code', () => {
      const details = getErrorDetails('INVALID' as OSSAErrorCode);
      expect(details).toBeUndefined();
    });
  });

  describe('searchErrorsByTag', () => {
    it('should find errors by tag', () => {
      const didErrors = searchErrorsByTag('did');
      expect(didErrors.length).toBeGreaterThan(0);
      didErrors.forEach((error) => {
        expect(error.tags).toContain('did');
      });
    });

    it('should find schema errors', () => {
      const schemaErrors = searchErrorsByTag('schema');
      expect(schemaErrors.length).toBeGreaterThan(0);
    });

    it('should find genetics errors', () => {
      const geneticsErrors = searchErrorsByTag('genetics');
      expect(geneticsErrors.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent tag', () => {
      const errors = searchErrorsByTag('non-existent-tag');
      expect(errors.length).toBe(0);
    });
  });

  describe('searchErrorsBySeverity', () => {
    it('should find all errors', () => {
      const errors = searchErrorsBySeverity('error');
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach((error) => {
        expect(error.severity).toBe('error');
      });
    });

    it('should find all warnings', () => {
      const warnings = searchErrorsBySeverity('warning');
      expect(warnings.length).toBeGreaterThan(0);
      warnings.forEach((warning) => {
        expect(warning.severity).toBe('warning');
      });
    });

    it('should find all info', () => {
      const info = searchErrorsBySeverity('info');
      expect(info.length).toBeGreaterThan(0);
      info.forEach((infoItem) => {
        expect(infoItem.severity).toBe('info');
      });
    });
  });

  describe('getAllErrorCodes', () => {
    it('should return all error codes', () => {
      const codes = getAllErrorCodes();
      expect(codes.length).toBe(101);
      expect(codes).toContain(OSSAErrorCode.OSSA_001);
      expect(codes).toContain(OSSAErrorCode.OSSA_906);
    });
  });

  describe('getErrorCountBySeverity', () => {
    it('should count errors by severity', () => {
      const counts = getErrorCountBySeverity();
      expect(counts.error).toBeGreaterThan(0);
      expect(counts.warning).toBeGreaterThan(0);
      expect(counts.info).toBeGreaterThan(0);
      expect(counts.error + counts.warning + counts.info).toBe(101);
    });

    it('should have approximately 70% errors', () => {
      const counts = getErrorCountBySeverity();
      const errorPercentage = (counts.error / 101) * 100;
      expect(errorPercentage).toBeGreaterThan(60);
      expect(errorPercentage).toBeLessThan(80);
    });
  });

  describe('Category Coverage', () => {
    it('should have schema validation errors (001-099)', () => {
      const schemaErrors = [
        OSSAErrorCode.OSSA_001,
        OSSAErrorCode.OSSA_010,
        OSSAErrorCode.OSSA_015,
      ];
      schemaErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have identity errors (100-199)', () => {
      const identityErrors = [
        OSSAErrorCode.OSSA_100,
        OSSAErrorCode.OSSA_110,
        OSSAErrorCode.OSSA_112,
      ];
      identityErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have genetics errors (200-299)', () => {
      const geneticsErrors = [
        OSSAErrorCode.OSSA_200,
        OSSAErrorCode.OSSA_210,
        OSSAErrorCode.OSSA_212,
      ];
      geneticsErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have lifecycle errors (300-399)', () => {
      const lifecycleErrors = [
        OSSAErrorCode.OSSA_300,
        OSSAErrorCode.OSSA_310,
        OSSAErrorCode.OSSA_311,
      ];
      lifecycleErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have economics errors (400-499)', () => {
      const economicsErrors = [
        OSSAErrorCode.OSSA_400,
        OSSAErrorCode.OSSA_410,
        OSSAErrorCode.OSSA_411,
      ];
      economicsErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have taxonomy errors (500-599)', () => {
      const taxonomyErrors = [
        OSSAErrorCode.OSSA_500,
        OSSAErrorCode.OSSA_505,
        OSSAErrorCode.OSSA_508,
      ];
      taxonomyErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have access control errors (600-699)', () => {
      const accessErrors = [
        OSSAErrorCode.OSSA_600,
        OSSAErrorCode.OSSA_610,
        OSSAErrorCode.OSSA_614,
      ];
      accessErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have revolutionary features errors (700-799)', () => {
      const revolutionaryErrors = [
        OSSAErrorCode.OSSA_700,
        OSSAErrorCode.OSSA_705,
        OSSAErrorCode.OSSA_706,
      ];
      revolutionaryErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have naming errors (800-899)', () => {
      const namingErrors = [
        OSSAErrorCode.OSSA_800,
        OSSAErrorCode.OSSA_805,
        OSSAErrorCode.OSSA_806,
      ];
      namingErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });

    it('should have catalog errors (900-999)', () => {
      const catalogErrors = [
        OSSAErrorCode.OSSA_900,
        OSSAErrorCode.OSSA_905,
        OSSAErrorCode.OSSA_906,
      ];
      catalogErrors.forEach((code) => {
        expect(ERROR_CATALOG[code]).toBeDefined();
      });
    });
  });

  describe('Error Examples', () => {
    it('should have examples for OSSA-001', () => {
      const details = getErrorDetails(OSSAErrorCode.OSSA_001);
      expect(details!.examples).toBeDefined();
      expect(details!.examples!.length).toBeGreaterThan(0);
      expect(details!.examples![0].invalid).toBeDefined();
      expect(details!.examples![0].valid).toBeDefined();
    });

    it('should have examples for OSSA-010', () => {
      const details = getErrorDetails(OSSAErrorCode.OSSA_010);
      expect(details!.examples).toBeDefined();
      expect(details!.examples!.length).toBeGreaterThan(0);
    });

    it('should have examples for OSSA-100', () => {
      const details = getErrorDetails(OSSAErrorCode.OSSA_100);
      expect(details!.examples).toBeDefined();
      expect(details!.examples!.length).toBeGreaterThan(0);
    });
  });
});
