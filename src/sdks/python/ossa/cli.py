"""OSSA CLI - Command-line interface for the OSSA SDK."""

import argparse
import sys
from pathlib import Path

from . import __version__
from .manifest import load_manifest
from .validator import validate_manifest
from .structure import AgentsFolderService


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(prog="ossa", description="OSSA SDK")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    validate_parser = subparsers.add_parser("validate", help="Validate manifest(s)")
    validate_parser.add_argument("files", nargs="+", help="Manifest file(s)")
    validate_parser.add_argument("--strict", action="store_true", help="Warnings as errors")

    info_parser = subparsers.add_parser("info", help="Show manifest info")
    info_parser.add_argument("file", help="Manifest file")

    scaffold_parser = subparsers.add_parser("scaffold", help="Scaffold agent folder structure")
    scaffold_parser.add_argument("name", help="Agent name")
    scaffold_parser.add_argument("--base-path", default=".agents", help="Base path for agents")
    scaffold_parser.add_argument("--overwrite", action="store_true", help="Overwrite existing structure")

    args = parser.parse_args()

    if args.command == "validate":
        return cmd_validate(args)
    elif args.command == "info":
        return cmd_info(args)
    elif args.command == "scaffold":
        return cmd_scaffold(args)
    else:
        parser.print_help()
        return 0


def cmd_validate(args: argparse.Namespace) -> int:
    """Validate command handler."""
    exit_code = 0
    for file_path in args.files:
        path = Path(file_path)
        if not path.exists():
            print(f"ERROR: File not found: {path}")
            exit_code = 1
            continue
        try:
            manifest = load_manifest(path)
            result = validate_manifest(manifest)
            if result.valid:
                print(f"OK: {path}")
                for warning in result.warnings:
                    print(f"  WARNING: {warning}")
                    if args.strict:
                        exit_code = 1
            else:
                print(f"INVALID: {path}")
                for error in result.errors:
                    print(f"  ERROR: {error}")
                exit_code = 1
        except Exception as e:
            print(f"ERROR: {path}: {e}")
            exit_code = 1
    return exit_code


def cmd_info(args: argparse.Namespace) -> int:
    """Info command handler."""
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {path}")
        return 1
    try:
        manifest = load_manifest(path)
        print(f"File: {path}")
        print(f"API Version: {manifest.api_version}")
        print(f"Kind: {manifest.kind}")
        print(f"Name: {manifest.name}")
        if manifest.version:
            print(f"Version: {manifest.version}")
        return 0
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


def cmd_scaffold(args: argparse.Namespace) -> int:
    """Scaffold command handler."""
    try:
        service = AgentsFolderService()
        structure = service.generate_structure(args.name, args.base_path)
        
        print(f"Creating folder structure for agent: {args.name}")
        service.create_structure(structure, args.overwrite)
        
        # Validate structure
        agent_dir = Path(args.base_path) / args.name
        validation = service.validate_structure(str(agent_dir))
        
        if validation["valid"]:
            print(f"✓ Folder structure created successfully at: {agent_dir}")
            print(f"  Created {len(structure.directories)} directories")
            print(f"  Created {len(structure.files)} files")
            return 0
        else:
            print("⚠ Structure created but validation failed:")
            for error in validation["errors"]:
                print(f"  - {error}")
            return 1
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
