"""OSSA Python SDK CLI."""

from __future__ import annotations

import argparse
import json
import sys

from . import __version__
from .manifest import load, export
from .validator import validate


def main() -> None:
    parser = argparse.ArgumentParser(prog="ossa-py", description="OSSA Python SDK CLI")
    parser.add_argument("--version", action="version", version=f"ossa-sdk {__version__}")

    sub = parser.add_subparsers(dest="command")

    # validate
    val = sub.add_parser("validate", help="Validate an OSSA manifest")
    val.add_argument("manifest", help="Path to manifest file")
    val.add_argument("--schema", help="Path to JSON Schema file")
    val.add_argument("--strict", action="store_true")

    # inspect
    ins = sub.add_parser("inspect", help="Display manifest info")
    ins.add_argument("manifest", help="Path to manifest file")

    # export
    exp = sub.add_parser("export", help="Export manifest to different format")
    exp.add_argument("manifest", help="Path to manifest file")
    exp.add_argument("--format", choices=["yaml", "json"], default="json")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "validate":
        try:
            manifest = load(args.manifest)
            result = validate(manifest, schema_path=args.schema, strict=args.strict)
            if result.valid:
                print(f"Valid: {manifest.metadata.name} ({manifest.kind.value})")
                if result.warnings:
                    for w in result.warnings:
                        print(f"  warn: {w}")
                sys.exit(0)
            else:
                print("Invalid:")
                for e in result.errors:
                    print(f"  error: {e}")
                sys.exit(1)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

    elif args.command == "inspect":
        try:
            manifest = load(args.manifest)
            print(f"Name:        {manifest.metadata.name}")
            print(f"Kind:        {manifest.kind.value}")
            print(f"Version:     {manifest.metadata.version or 'unset'}")
            print(f"API Version: {manifest.apiVersion}")
            if manifest.metadata.description:
                print(f"Description: {manifest.metadata.description[:100]}")
            if manifest.security:
                print(f"Security:    tier={manifest.security.tier or 'unset'}")
            if manifest.protocols:
                protos = []
                if manifest.protocols.mcp:
                    protos.append("MCP")
                if manifest.protocols.a2a:
                    protos.append("A2A")
                if manifest.protocols.anp:
                    protos.append("ANP")
                if protos:
                    print(f"Protocols:   {', '.join(protos)}")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

    elif args.command == "export":
        try:
            manifest = load(args.manifest)
            print(export(manifest, args.format))
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
