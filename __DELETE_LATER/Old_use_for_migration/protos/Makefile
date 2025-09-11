# OSSA Protocol Buffer Build System
# Generates gRPC client/server code for multiple languages

# Directories
PROTO_DIR := .
GEN_DIR := gen
GO_OUT := $(GEN_DIR)/go
TS_OUT := $(GEN_DIR)/typescript
PYTHON_OUT := $(GEN_DIR)/python
RUST_OUT := $(GEN_DIR)/rust
JAVA_OUT := $(GEN_DIR)/java
CSHARP_OUT := $(GEN_DIR)/csharp

# Proto files
PROTO_FILES := $(wildcard $(PROTO_DIR)/*.proto)

# Protobuf compiler
PROTOC := protoc

# Default target
.PHONY: all
all: go typescript python

# Clean generated files
.PHONY: clean
clean:
	rm -rf $(GEN_DIR)

# Create output directories
.PHONY: dirs
dirs:
	mkdir -p $(GO_OUT)
	mkdir -p $(TS_OUT)
	mkdir -p $(PYTHON_OUT)
	mkdir -p $(RUST_OUT)
	mkdir -p $(JAVA_OUT)
	mkdir -p $(CSHARP_OUT)

# Generate Go code
.PHONY: go
go: dirs
	@echo "Generating Go protobuf code..."
	$(PROTOC) \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GO_OUT) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GO_OUT) \
		--go-grpc_opt=paths=source_relative \
		$(PROTO_FILES)
	@echo "Go code generated in $(GO_OUT)"

# Generate TypeScript code
.PHONY: typescript
typescript: dirs
	@echo "Generating TypeScript protobuf code..."
	$(PROTOC) \
		--proto_path=$(PROTO_DIR) \
		--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
		--ts_out=service=grpc-node,mode=grpc-js:$(TS_OUT) \
		--js_out=import_style=commonjs,binary:$(TS_OUT) \
		--grpc_out=grpc_js:$(TS_OUT) \
		$(PROTO_FILES)
	@echo "TypeScript code generated in $(TS_OUT)"

# Generate Python code
.PHONY: python
python: dirs
	@echo "Generating Python protobuf code..."
	python -m grpc_tools.protoc \
		--proto_path=$(PROTO_DIR) \
		--python_out=$(PYTHON_OUT) \
		--grpc_python_out=$(PYTHON_OUT) \
		$(PROTO_FILES)
	@echo "Python code generated in $(PYTHON_OUT)"

# Generate Rust code (requires additional setup)
.PHONY: rust
rust: dirs
	@echo "Generating Rust protobuf code..."
	@echo "Note: Rust code generation requires tonic-build in build.rs"
	@echo "See documentation for Rust setup instructions"

# Generate Java code
.PHONY: java
java: dirs
	@echo "Generating Java protobuf code..."
	$(PROTOC) \
		--proto_path=$(PROTO_DIR) \
		--java_out=$(JAVA_OUT) \
		--grpc-java_out=$(JAVA_OUT) \
		$(PROTO_FILES)
	@echo "Java code generated in $(JAVA_OUT)"

# Generate C# code
.PHONY: csharp
csharp: dirs
	@echo "Generating C# protobuf code..."
	$(PROTOC) \
		--proto_path=$(PROTO_DIR) \
		--csharp_out=$(CSHARP_OUT) \
		--grpc_out=$(CSHARP_OUT) \
		--plugin=protoc-gen-grpc=$(shell which grpc_csharp_plugin) \
		$(PROTO_FILES)
	@echo "C# code generated in $(CSHARP_OUT)"

# Validate proto files
.PHONY: validate
validate:
	@echo "Validating protobuf files..."
	$(PROTOC) --proto_path=$(PROTO_DIR) --descriptor_set_out=/dev/null $(PROTO_FILES)
	@echo "All protobuf files are valid"

# Lint proto files (requires buf)
.PHONY: lint
lint:
	@echo "Linting protobuf files..."
	@if command -v buf >/dev/null 2>&1; then \
		buf lint; \
	else \
		echo "buf not installed, skipping lint"; \
	fi

# Format proto files (requires clang-format)
.PHONY: format
format:
	@echo "Formatting protobuf files..."
	@if command -v clang-format >/dev/null 2>&1; then \
		find $(PROTO_DIR) -name '*.proto' -exec clang-format -i {} \;; \
		echo "Proto files formatted"; \
	else \
		echo "clang-format not installed, skipping format"; \
	fi

# Generate documentation (requires protoc-gen-doc)
.PHONY: docs
docs: dirs
	@echo "Generating protobuf documentation..."
	@if command -v protoc-gen-doc >/dev/null 2>&1; then \
		$(PROTOC) \
			--proto_path=$(PROTO_DIR) \
			--doc_out=$(GEN_DIR) \
			--doc_opt=html,index.html \
			$(PROTO_FILES); \
		echo "Documentation generated in $(GEN_DIR)/index.html"; \
	else \
		echo "protoc-gen-doc not installed, skipping documentation"; \
	fi

# Install dependencies
.PHONY: install-deps
install-deps:
	@echo "Installing protobuf dependencies..."
	
	# Go dependencies
	@if command -v go >/dev/null 2>&1; then \
		go install google.golang.org/protobuf/cmd/protoc-gen-go@latest; \
		go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest; \
		echo "Go protobuf tools installed"; \
	fi
	
	# Node.js dependencies
	@if command -v npm >/dev/null 2>&1; then \
		npm install -g grpc-tools @grpc/grpc-js @grpc/proto-loader; \
		echo "Node.js protobuf tools installed"; \
	fi
	
	# Python dependencies
	@if command -v pip >/dev/null 2>&1; then \
		pip install grpcio-tools grpcio; \
		echo "Python protobuf tools installed"; \
	fi

# Check if tools are installed
.PHONY: check-tools
check-tools:
	@echo "Checking protobuf tools..."
	@command -v $(PROTOC) >/dev/null 2>&1 || { echo "protoc not installed"; exit 1; }
	@echo "✓ protoc installed"
	
	@if command -v protoc-gen-go >/dev/null 2>&1; then \
		echo "✓ protoc-gen-go installed"; \
	else \
		echo "✗ protoc-gen-go not installed"; \
	fi
	
	@if command -v protoc-gen-go-grpc >/dev/null 2>&1; then \
		echo "✓ protoc-gen-go-grpc installed"; \
	else \
		echo "✗ protoc-gen-go-grpc not installed"; \
	fi

# Development workflow
.PHONY: dev
dev: clean validate lint all docs
	@echo "Development build complete"

# CI/CD workflow
.PHONY: ci
ci: check-tools validate lint go python
	@echo "CI build complete"

# Watch for changes and rebuild (requires entr or similar)
.PHONY: watch
watch:
	@if command -v entr >/dev/null 2>&1; then \
		ls $(PROTO_FILES) | entr -r make dev; \
	else \
		echo "entr not installed. Install with: brew install entr"; \
	fi

# Help target
.PHONY: help
help:
	@echo "OSSA Protocol Buffer Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all           - Generate Go, TypeScript, and Python code"
	@echo "  go            - Generate Go protobuf code"
	@echo "  typescript    - Generate TypeScript protobuf code"
	@echo "  python        - Generate Python protobuf code"
	@echo "  rust          - Generate Rust protobuf code"
	@echo "  java          - Generate Java protobuf code"
	@echo "  csharp        - Generate C# protobuf code"
	@echo "  clean         - Clean generated files"
	@echo "  validate      - Validate protobuf files"
	@echo "  lint          - Lint protobuf files"
	@echo "  format        - Format protobuf files"
	@echo "  docs          - Generate documentation"
	@echo "  install-deps  - Install protobuf dependencies"
	@echo "  check-tools   - Check if required tools are installed"
	@echo "  dev           - Development workflow (clean, validate, lint, build, docs)"
	@echo "  ci            - CI/CD workflow"
	@echo "  watch         - Watch for changes and rebuild"
	@echo "  help          - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make all              - Generate code for all languages"
	@echo "  make go typescript    - Generate Go and TypeScript code"
	@echo "  make clean all        - Clean and regenerate all code"
	@echo "  make dev              - Full development build with validation"

# Make help the default target if no target is specified
.DEFAULT_GOAL := help