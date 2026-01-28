# Security Policy

## Supported Versions

We actively support the following versions of OSSA with security updates:

| Version | Supported |
| ------- | --------- |
| 0.3.x   | Yes       |
| 0.2.x   | Yes       |
| < 0.2.0 | No        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Email (Preferred)
- **Email**: security@openstandardagents.org
- **Subject**: `[SECURITY] <brief description>`
- **Response Time**: We aim to respond within 48 hours

### Discord (For Non-Critical Issues)
- Join our [Discord server](https://discord.gg/ossa)
- Message a maintainer in the `#security` channel (if available)
- Use this only for non-critical security concerns

### What to Include

When reporting a vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact if exploited
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Proof of Concept**: If possible, include a minimal proof of concept
5. **Suggested Fix**: If you have ideas for a fix, please share them
6. **Affected Versions**: Which versions are affected

### Disclosure Policy

We follow a **responsible disclosure** process:

1. **Initial Report**: You report the vulnerability privately
2. **Acknowledgment**: We acknowledge receipt within 48 hours
3. **Investigation**: We investigate and verify the issue (typically 1-2 weeks)
4. **Fix Development**: We develop a fix (timeline depends on severity)
5. **Coordination**: We coordinate with you on disclosure timing
6. **Public Disclosure**: After a fix is released, we may publicly disclose (with your permission)

### Severity Levels

We use the following severity levels:

- **Critical**: Remote code execution, authentication bypass, data breach
  - **Response Time**: 24 hours
  - **Fix Timeline**: 7 days
  
- **High**: Privilege escalation, sensitive data exposure
  - **Response Time**: 48 hours
  - **Fix Timeline**: 14 days
  
- **Medium**: Information disclosure, denial of service
  - **Response Time**: 72 hours
  - **Fix Timeline**: 30 days
  
- **Low**: Minor security improvements, best practice violations
  - **Response Time**: 1 week
  - **Fix Timeline**: Next release

### Recognition

We believe in recognizing security researchers who help keep OSSA secure:

- **Hall of Fame**: Security researchers will be listed in our security acknowledgments (with permission)
- **Credit**: You will be credited in security advisories (if desired)
- **Early Access**: You may receive early access to fixes before public release

### Scope

#### In Scope
- OSSA specification vulnerabilities
- CLI tool security issues
- Schema validation bypasses
- Documentation security concerns

#### Out of Scope
- Issues in third-party dependencies (report to the dependency maintainer)
- Issues in example code (unless they demonstrate a spec vulnerability)
- Social engineering attacks
- Physical security issues
- Denial of service attacks that don't expose vulnerabilities

### Security Best Practices

When using OSSA:

1. **Keep Dependencies Updated**: Regularly update `@bluefly/openstandardagents`
2. **Validate Manifests**: Always validate OSSA manifests before execution
3. **Use Latest Spec**: Use the latest OSSA spec version when possible
4. **Review Examples**: Review example agents before deploying
5. **Secure Secrets**: Never commit API keys or secrets to version control
6. **Follow Principle of Least Privilege**: Grant agents only necessary permissions

### Security Updates

Security updates are released as:
- **Patch Releases**: For critical and high severity issues
- **Minor Releases**: For medium severity issues (may be included in regular releases)
- **Documentation Updates**: For low severity issues and best practices

### Contact

For security-related questions or concerns:
- **Email**: security@openstandardagents.org
- **Discord**: [Join our community](https://discord.gg/ossa) (use `#security` channel if available)

---

**Thank you for helping keep OSSA and our community safe!**
