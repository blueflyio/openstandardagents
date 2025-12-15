# OSSA SDKs

Official Software Development Kits for the Open Standard for Scalable AI Agents (OSSA).

## Available SDKs

### Python SDK ✅ (Ready for Production)

**Location**: `sdks/python/`

**Status**: Production-ready, ready for enterprise adoption TODAY

**Features**:
- Type-safe Pydantic models for all OSSA v0.3.0 types
- Load, validate, and export manifests (YAML, JSON, Python)
- CLI tool for working with manifests
- Comprehensive test suite with >90% coverage
- Full documentation and examples

**Quick Start**:
```bash
cd python/
pip install -e ".[dev]"
ossa validate ../../examples/getting-started/01-minimal-agent.ossa.yaml
```

**Documentation**: [python/README.md](python/README.md)

---

## Planned SDKs

### TypeScript/JavaScript SDK (Planned)

**Location**: `sdks/typescript/` (coming soon)

**Features** (planned):
- TypeScript type definitions from OSSA schema
- Node.js and browser support
- NPM package
- CLI tool
- Full ESM and CJS support

### Go SDK (Planned)

**Location**: `sdks/go/` (coming soon)

**Features** (planned):
- Go structs from OSSA schema
- Validation and serialization
- Go modules support
- CLI tool

### Rust SDK (Planned)

**Location**: `sdks/rust/` (coming soon)

**Features** (planned):
- Serde serialization/deserialization
- Type-safe Rust structs
- Cargo package
- WebAssembly support

---

## SDK Requirements

All OSSA SDKs must support:

### Core Operations
- [ ] Load manifests from YAML/JSON files
- [ ] Validate manifests against OSSA schema
- [ ] Export manifests to different formats
- [ ] Environment variable substitution
- [ ] Type-safe models/structs

### Validation
- [ ] JSON schema validation
- [ ] Semantic validation (e.g., version format)
- [ ] Strict mode with warnings
- [ ] Detailed error messages

### CLI Tool
- [ ] `validate` command
- [ ] `inspect` command
- [ ] `export` command
- [ ] Help and documentation

### Quality
- [ ] Unit tests (>80% coverage)
- [ ] Type checking (TypeScript, mypy, etc.)
- [ ] Linting and formatting
- [ ] CI/CD integration
- [ ] Documentation and examples

### Package Distribution
- [ ] Published to language-specific package registry
- [ ] Semantic versioning
- [ ] Changelog
- [ ] License (MIT)

---

## Contributing a New SDK

Want to create an SDK for your favorite language? See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Steps

1. **Create Issue**: Propose the SDK on GitLab
2. **Directory**: Create `sdks/<language>/`
3. **Implement**: Follow SDK requirements above
4. **Test**: Achieve >80% test coverage
5. **Document**: README, examples, API docs
6. **Submit**: Merge request for review

### Template Structure

```
sdks/<language>/
├── README.md              # Installation and usage
├── QUICKSTART.md          # 5-minute tutorial
├── src/                   # Source code
│   ├── types.*           # Type definitions
│   ├── manifest.*        # Load/validate/export
│   ├── validator.*       # Schema validation
│   └── cli.*             # Command-line tool
├── tests/                 # Test suite
├── examples/              # Usage examples
└── package.*             # Package manifest
```

---

## SDK Comparison

| Feature | Python | TypeScript | Go | Rust |
|---------|--------|------------|-----|------|
| Status | ✅ Ready | 🚧 Planned | 🚧 Planned | 🚧 Planned |
| Load Manifests | ✅ | 🚧 | 🚧 | 🚧 |
| Validate | ✅ | 🚧 | 🚧 | 🚧 |
| Export | ✅ | 🚧 | 🚧 | 🚧 |
| CLI Tool | ✅ | 🚧 | 🚧 | 🚧 |
| Tests | ✅ | 🚧 | 🚧 | 🚧 |
| Published | 🚧 | 🚧 | 🚧 | 🚧 |

---

## Resources

- **OSSA Specification**: [spec/](../spec/)
- **Examples**: [examples/](../examples/)
- **Documentation**: https://openstandardagents.org/docs
- **Issues**: https://gitlab.com/blueflyio/openstandardagents/-/issues

---

## Support

- **Repository**: https://gitlab.com/blueflyio/openstandardagents
- **Documentation**: https://openstandardagents.org/docs
- **Community**: https://openstandardagents.org/community

---

## License

All OSSA SDKs are released under the MIT License. See [LICENSE](../LICENSE) for details.
