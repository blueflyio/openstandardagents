# OSSA Error Code Catalog

**Version**: 0.3.6
**Last Updated**: 2026-01-27

Comprehensive error code reference for OSSA manifest validation. All error codes follow the format `OSSA-XXX`.

## Quick Navigation

- [Schema Validation (001-099)](#schema-validation-001-099)
- [Identity & DID (100-199)](#identity--did-100-199)
- [Genetics & Breeding (200-299)](#genetics--breeding-200-299)
- [Lifecycle (300-399)](#lifecycle-300-399)
- [Economics & Marketplace (400-499)](#economics--marketplace-400-499)
- [Taxonomy (500-599)](#taxonomy-500-599)
- [Access Control & Separation of Duties (600-699)](#access-control--separation-of-duties-600-699)
- [Revolutionary Features (700-799)](#revolutionary-features-700-799)
- [Naming & Format (800-899)](#naming--format-800-899)
- [Catalog & Publishing (900-999)](#catalog--publishing-900-999)

## Error Statistics

| Severity | Count | Percentage |
|----------|-------|------------|
| Error    | 71    | 70%        |
| Warning  | 24    | 24%        |
| Info     | 6     | 6%         |
| **Total**| **101**| **100%**  |

## Schema Validation (001-099)

Core JSON Schema validation errors for OSSA manifests.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| [OSSA-001](./ossa-001.md) | error | Missing required field | schema, validation, required |
| [OSSA-002](./ossa-002.md) | error | Invalid field type | schema, validation, type |
| [OSSA-003](./ossa-003.md) | error | Invalid apiVersion format | schema, validation, version |
| [OSSA-004](./ossa-004.md) | error | Invalid kind value | schema, validation, enum |
| [OSSA-005](./ossa-005.md) | error | Missing spec field | schema, validation, required, spec |
| [OSSA-006](./ossa-006.md) | error | Invalid spec for kind | schema, validation, spec |
| [OSSA-007](./ossa-007.md) | error | Invalid enum value | schema, validation, enum |
| [OSSA-008](./ossa-008.md) | error | Pattern mismatch | schema, validation, pattern |
| [OSSA-009](./ossa-009.md) | error | Invalid array item | schema, validation, array |
| [OSSA-010](./ossa-010.md) | error | Duplicate array values | schema, validation, array, unique |
| [OSSA-011](./ossa-011.md) | error | Invalid JSON format | schema, validation, json |
| [OSSA-012](./ossa-012.md) | warning | Schema version mismatch | schema, validation, version |
| [OSSA-013](./ossa-013.md) | error | Additional properties not allowed | schema, validation, properties |
| [OSSA-014](./ossa-014.md) | error | Invalid number range | schema, validation, number |
| [OSSA-015](./ossa-015.md) | error | Invalid string length | schema, validation, string |

## Identity & DID (100-199)

Decentralized identity and DID-based agent identity errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| [OSSA-100](./ossa-100.md) | error | Invalid DID format | identity, did, format |
| OSSA-101 | error | DID pattern mismatch | identity, did, pattern |
| OSSA-102 | warning | Missing DID for genetics | identity, did, genetics |
| OSSA-103 | warning | Missing DID for economics | identity, did, economics |
| OSSA-104 | warning | DID without credentials | identity, did, credentials |
| OSSA-105 | error | Invalid credential format | identity, credentials, format |
| OSSA-106 | warning | Expired credential | identity, credentials, expiration |
| OSSA-107 | error | Invalid reputation score | identity, reputation |
| OSSA-108 | warning | Missing credit_score | identity, reputation, credit |
| OSSA-109 | error | Invalid service account provider | identity, service-account, provider |
| OSSA-110 | error | Missing service account details | identity, service-account |
| OSSA-111 | error | Invalid GitLab scopes | identity, gitlab, scopes |
| OSSA-112 | error | Scope conflicts with tier | identity, scopes, tier |

## Genetics & Breeding (200-299)

Agent genetics, breeding, and evolutionary algorithm errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-200 | error | Invalid generation number | genetics, generation |
| OSSA-201 | error | Missing parent DIDs | genetics, breeding, parents |
| OSSA-202 | warning | Invalid parent DID count | genetics, breeding, parents |
| OSSA-203 | error | Invalid fitness score | genetics, fitness |
| OSSA-204 | warning | Missing fitness score | genetics, fitness |
| OSSA-205 | error | Invalid task success rate | genetics, fitness, metrics |
| OSSA-206 | error | Invalid user satisfaction | genetics, fitness, metrics |
| OSSA-207 | error | Invalid cost efficiency | genetics, fitness, metrics |
| OSSA-208 | warning | Missing breeding criteria | genetics, breeding, fitness |
| OSSA-209 | warning | Invalid mutation count | genetics, mutation |
| [OSSA-210](./ossa-210.md) | warning | Invalid trait | genetics, traits |
| OSSA-211 | error | Generation mismatch with parents | genetics, generation, breeding |
| OSSA-212 | warning | Breeding ineligible fitness | genetics, fitness, breeding |

## Lifecycle (300-399)

Agent lifecycle stages, career progression, and retirement errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-300 | error | Invalid lifecycle stage | lifecycle, stage |
| OSSA-301 | warning | Missing retired_at timestamp | lifecycle, retirement |
| OSSA-302 | warning | Retirement without legacy | lifecycle, retirement, legacy |
| OSSA-303 | error | Invalid promotion entry | lifecycle, career, promotion |
| OSSA-304 | warning | Missing training hours | lifecycle, career, training |
| OSSA-305 | warning | Invalid certifications | lifecycle, career, certifications |
| OSSA-306 | error | Stage transition violation | lifecycle, stage, transition |
| OSSA-307 | info | Senior without promotions | lifecycle, career, promotion |
| OSSA-308 | error | Invalid skill level | lifecycle, skills |
| OSSA-309 | warning | Missing onboarding date | lifecycle, onboarding |
| OSSA-310 | warning | Invalid retirement eligibility | lifecycle, retirement |
| OSSA-311 | error | Lifecycle state inconsistency | lifecycle, consistency |

## Economics & Marketplace (400-499)

Agent economics, marketplace, and payment system errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-400 | error | Negative wallet balance | economics, wallet |
| OSSA-401 | error | Missing wallet for marketplace | economics, marketplace, wallet |
| OSSA-402 | warning | Invalid offering price | economics, marketplace, pricing |
| OSSA-403 | warning | Missing payment method | economics, wallet, payment |
| OSSA-404 | error | Invalid currency | economics, currency |
| OSSA-405 | warning | Marketplace offering without DID | economics, marketplace, identity |
| OSSA-406 | error | Invalid transaction history | economics, transactions |
| OSSA-407 | warning | Retired agent with offerings | economics, marketplace, lifecycle |
| OSSA-408 | error | Invalid pricing model | economics, pricing |
| OSSA-409 | warning | Missing service description | economics, marketplace |
| OSSA-410 | error | Invalid revenue share | economics, revenue |
| OSSA-411 | error | Offering price inconsistency | economics, pricing |

## Taxonomy (500-599)

Agent taxonomy classification and domain errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-500 | error | Missing domain | taxonomy, domain |
| OSSA-501 | error | Invalid domain value | taxonomy, domain |
| OSSA-502 | warning | Invalid subdomain for domain | taxonomy, subdomain |
| OSSA-503 | error | Invalid capability pattern | taxonomy, capability |
| OSSA-504 | warning | Invalid concern value | taxonomy, concerns |
| OSSA-505 | info | Type-domain mismatch | taxonomy, type, domain |
| OSSA-506 | warning | Missing taxonomy classification | taxonomy |
| OSSA-507 | warning | Tier-domain mismatch | taxonomy, tier, domain |
| OSSA-508 | error | Invalid recommended_tier | taxonomy, tier |

## Access Control & Separation of Duties (600-699)

Access tier, permissions, role separation, and delegation errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-600 | error | Invalid access tier | access-control, tier |
| OSSA-601 | warning | Missing tier configuration | access-control, tier |
| OSSA-602 | error | Invalid permission | access-control, permissions |
| OSSA-603 | error | Permission-tier mismatch | access-control, tier, permissions |
| OSSA-604 | error | Invalid audit level | access-control, audit |
| OSSA-605 | error | Missing approval chain | access-control, approval |
| OSSA-606 | error | Invalid isolation level | access-control, isolation |
| OSSA-607 | error | Role conflict detected | separation-of-duties, role, conflict |
| OSSA-608 | error | Invalid role value | separation-of-duties, role |
| OSSA-609 | error | Prohibited action in role | separation-of-duties, role, prohibited |
| OSSA-610 | error | Invalid delegation tier | separation-of-duties, delegation, tier |
| OSSA-611 | error | Delegation to higher tier | separation-of-duties, delegation |
| OSSA-612 | error | Missing delegation token | separation-of-duties, delegation |
| OSSA-613 | error | Self-delegation prohibited | separation-of-duties, delegation |
| OSSA-614 | error | Conflicting roles assigned | separation-of-duties, role, conflict |

## Revolutionary Features (700-799)

Revolutionary feature errors (genetics, economics, lifecycle, team collaboration).

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-700 | warning | Feature requires DID | revolutionary, identity, did |
| OSSA-701 | error | Incompatible feature combination | revolutionary, compatibility |
| OSSA-702 | error | Missing prerequisite feature | revolutionary, prerequisites |
| OSSA-703 | error | Feature tier restriction | revolutionary, tier |
| OSSA-704 | warning | Team membership without lifecycle | revolutionary, team, lifecycle |
| OSSA-705 | error | Invalid team role | revolutionary, team, role |
| OSSA-706 | error | Team hierarchy violation | revolutionary, team, hierarchy |

## Naming & Format (800-899)

Naming conventions, DNS compliance, and format validation errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-800 | error | Invalid DNS-1123 format | naming, format, dns |
| OSSA-801 | error | Name too long | naming, length |
| OSSA-802 | error | Name contains invalid characters | naming, characters |
| OSSA-803 | error | Invalid URL format | format, url |
| OSSA-804 | error | Invalid email format | format, email |
| OSSA-805 | error | Invalid date format | format, date |
| OSSA-806 | error | Invalid version format | format, version |

## Catalog & Publishing (900-999)

Agent catalog, publishing, and discoverability errors.

| Code | Severity | Message | Tags |
|------|----------|---------|------|
| OSSA-900 | warning | Published without documentation | catalog, publishing, documentation |
| OSSA-901 | error | Invalid visibility value | catalog, visibility |
| OSSA-902 | info | Public agent without ratings | catalog, ratings |
| OSSA-903 | warning | Missing license for public agent | catalog, license |
| OSSA-904 | error | Invalid rating value | catalog, ratings |
| OSSA-905 | warning | Missing catalog metadata | catalog, metadata |
| OSSA-906 | error | Invalid maturity level | catalog, maturity |

## Usage

### Command Line

```bash
# Validate with error codes
ossa validate manifest.json

# Output formats
ossa validate manifest.json --format=json
ossa validate manifest.json --format=markdown
ossa validate manifest.json --format=html

# Filter by severity
ossa validate manifest.json --errors-only
ossa validate manifest.json --warnings-only
```

### Programmatic

```typescript
import { OSSAValidator } from '@openstandardagents/core';
import { formatErrorReport, createErrorReport } from './error-formatter';

const validator = new OSSAValidator();
const result = validator.validateFile('manifest.json');

// Format errors with codes
const report = createErrorReport(result.errors);
console.log(formatErrorReport(report));

// Search by error code
import { getErrorDetails, OSSAErrorCode } from './error-codes';
const details = getErrorDetails(OSSAErrorCode.OSSA_001);
```

## Contributing

Found an error code that needs better documentation? Submit a PR!

1. Update `src/validation/error-codes.ts` with improved remediation
2. Create detailed documentation in `docs/errors/ossa-XXX.md`
3. Include examples of invalid vs valid manifests
4. Add to this catalog with a link

## See Also

- [OSSA Specification](../../spec/v0.3/ossa-0.3.6.schema.json)
- [Validation Guide](../validation-guide.md)
- [Best Practices](../best-practices.md)
- [Migration Guide](../migration-guide.md)
