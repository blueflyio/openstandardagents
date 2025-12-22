# Contributing to OSSA Python SDK

Thank you for your interest in contributing to the OSSA Python SDK!

## Development Setup

### 1. Clone the Repository

```bash
git clone https://gitlab.com/blueflyio/openstandardagents.git
cd openstandardagents/sdks/python
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Development Dependencies

```bash
pip install -e ".[dev]"
```

This installs:
- The SDK in editable mode
- Testing tools (pytest, pytest-cov)
- Code quality tools (black, ruff, mypy)
- Type stubs for dependencies

## Development Workflow

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=ossa --cov-report=term-missing --cov-report=html

# Run specific test file
pytest tests/test_manifest.py

# Run specific test
pytest tests/test_manifest.py::TestLoadManifest::test_load_valid_yaml
```

### Code Quality

```bash
# Format code
black .

# Lint code
ruff check .

# Type checking
mypy ossa/
```

### Pre-commit Checks

Before committing, run:

```bash
# Format, lint, type check, and test
black . && ruff check . && mypy ossa/ && pytest
```

## Project Structure

```
sdks/python/
├── ossa/                    # Main package
│   ├── __init__.py         # Public API exports
│   ├── types.py            # Pydantic models
│   ├── manifest.py         # Core manifest operations
│   ├── validator.py        # JSON schema validation
│   ├── exceptions.py       # Custom exceptions
│   └── cli.py              # Command-line interface
├── tests/                   # Test suite
│   ├── test_manifest.py    # Manifest operation tests
│   └── ...
├── examples/                # Usage examples
├── pyproject.toml          # Project configuration
└── README.md               # Documentation
```

## Adding New Features

### 1. Create an Issue

Before implementing a feature, create an issue at:
https://gitlab.com/blueflyio/openstandardagents/-/issues

### 2. Create a Branch

```bash
git checkout -b feature/<issue-number>-<short-description>
```

### 3. Implement the Feature

- Write code following existing patterns
- Add type hints to all functions
- Follow PEP 8 style guide
- Use docstrings (Google style)

### 4. Add Tests

Every new feature should have tests:

```python
# tests/test_new_feature.py
import pytest
from ossa import new_feature

def test_new_feature_basic():
    result = new_feature()
    assert result is not None

def test_new_feature_error_handling():
    with pytest.raises(ValueError):
        new_feature(invalid_input=True)
```

### 5. Update Documentation

- Add docstrings to new functions
- Update README.md if needed
- Add examples if appropriate

### 6. Submit a Merge Request

```bash
git add .
git commit -m "feat: add new feature (closes #123)"
git push origin feature/<issue-number>-<short-description>
```

Then create a merge request on GitLab.

## Code Style

### Python Style

- Follow PEP 8
- Use type hints everywhere
- Maximum line length: 100 characters
- Use f-strings for formatting

### Example Function

```python
def load_manifest(path: Union[str, Path]) -> OSSAManifest:
    """
    Load and parse an OSSA manifest from a file.

    Args:
        path: Path to the manifest file (YAML or JSON)

    Returns:
        Parsed and validated OSSAManifest object

    Raises:
        ManifestNotFoundError: If the file doesn't exist
        ManifestParseError: If the file cannot be parsed
        ManifestValidationError: If the manifest is invalid

    Example:
        >>> manifest = load_manifest("my-agent.ossa.yaml")
        >>> print(manifest.metadata.name)
        'my-agent'
    """
    # Implementation...
```

### Docstring Format (Google Style)

```python
def function(arg1: str, arg2: int = 0) -> bool:
    """
    Short description of function.

    Longer description if needed. Can span multiple lines
    and include detailed explanations.

    Args:
        arg1: Description of first argument
        arg2: Description of second argument. Defaults to 0.

    Returns:
        Description of return value

    Raises:
        ValueError: When something goes wrong

    Example:
        >>> result = function("test", 42)
        >>> assert result is True
    """
    pass
```

## Testing Guidelines

### Test Coverage

Aim for >90% code coverage. Key areas:

- Happy path (normal usage)
- Edge cases (empty inputs, None values)
- Error conditions (invalid inputs)
- Type validation

### Test Naming

```python
def test_<feature>_<scenario>():
    """Test <feature> when <scenario>."""
    pass

# Examples:
def test_load_manifest_valid_yaml():
    """Test loading a valid YAML manifest."""

def test_validate_manifest_missing_field():
    """Test validation with missing required field."""
```

### Test Structure (Arrange-Act-Assert)

```python
def test_example():
    # Arrange: Set up test data
    manifest_path = tmp_path / "test.yaml"
    manifest_path.write_text(VALID_YAML)

    # Act: Execute the function
    result = load_manifest(manifest_path)

    # Assert: Check the results
    assert result.metadata.name == "test-agent"
    assert result.kind == OSSAKind.AGENT
```

## Release Process

(For maintainers)

### 1. Update Version

Edit `pyproject.toml`:

```toml
[project]
version = "0.3.1"
```

### 2. Update CHANGELOG

Document changes in a release notes file.

### 3. Create Git Tag

```bash
git tag -a v0.3.0 -m "Release v0.3.0"
git push origin v0.3.0
```

### 4. Build and Publish

```bash
# Build distribution
python -m build

# Upload to PyPI
python -m twine upload dist/*
```

## Common Issues

### Import Errors in Tests

If tests can't import the package:

```bash
# Make sure you installed in editable mode
pip install -e .
```

### Type Checking Errors

If mypy reports errors:

```bash
# Install type stubs
pip install types-pyyaml types-requests
```

### Coverage Not Working

```bash
# Install coverage plugin
pip install pytest-cov
```

## Questions?

- Documentation: https://openstandardagents.org/docs
- Issues: https://gitlab.com/blueflyio/openstandardagents/-/issues
- Community: https://openstandardagents.org/community

## Code of Conduct

Please be respectful and constructive in all interactions. We're building this together!

---

Thank you for contributing to OSSA! 🎉
