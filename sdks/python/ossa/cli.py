"""
Command-line interface for OSSA SDK.

Provides a user-friendly CLI for validating, inspecting, and exporting OSSA manifests.
"""

from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

from . import __version__
from .exceptions import OSSAError
from .manifest import export_manifest, load_manifest, validate_manifest

console = Console()


@click.group()
@click.version_option(version=__version__, prog_name="ossa")
def main() -> None:
    """
    OSSA SDK - Python toolkit for Open Standard for Scalable AI Agents.

    Work with OSSA manifests: validate, inspect, and export agent definitions.
    """
    pass


@main.command()
@click.argument("manifest_path", type=click.Path(exists=True))
@click.option(
    "--strict",
    is_flag=True,
    help="Enable strict validation with additional checks",
)
@click.option(
    "--schema-path",
    type=click.Path(exists=True),
    help="Path to local JSON schema directory",
)
@click.option(
    "--json",
    "output_json",
    is_flag=True,
    help="Output validation result as JSON",
)
def validate(
    manifest_path: str,
    strict: bool,
    schema_path: Optional[str],
    output_json: bool,
) -> None:
    """
    Validate an OSSA manifest.

    Checks the manifest against the OSSA specification and reports any errors or warnings.

    Example:
        ossa validate my-agent.ossa.yaml
        ossa validate my-agent.ossa.yaml --strict
    """
    try:
        schema_path_obj = Path(schema_path) if schema_path else None
        result = validate_manifest(manifest_path, schema_path=schema_path_obj, strict=strict)

        if output_json:
            import json

            click.echo(json.dumps(result.model_dump(), indent=2))
            return

        if result.valid:
            console.print("[green]✓[/green] Manifest is valid!")

            if result.manifest:
                console.print(f"  Name: {result.manifest.metadata.name}")
                console.print(f"  Version: {result.manifest.metadata.version}")
                console.print(f"  Kind: {result.manifest.kind.value}")
                console.print(f"  API Version: {result.manifest.apiVersion}")

            if result.warnings:
                console.print("\n[yellow]Warnings:[/yellow]")
                for warning in result.warnings:
                    console.print(f"  [yellow]•[/yellow] {warning}")
        else:
            console.print("[red]✗[/red] Manifest validation failed\n")
            console.print("[red]Errors:[/red]")
            for error in result.errors:
                console.print(f"  [red]•[/red] {error}")

            if result.warnings:
                console.print("\n[yellow]Warnings:[/yellow]")
                for warning in result.warnings:
                    console.print(f"  [yellow]•[/yellow] {warning}")

            raise click.Abort()

    except OSSAError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@main.command()
@click.argument("manifest_path", type=click.Path(exists=True))
@click.option(
    "--format",
    "output_format",
    type=click.Choice(["table", "yaml", "json"]),
    default="table",
    help="Output format",
)
def inspect(manifest_path: str, output_format: str) -> None:
    """
    Inspect an OSSA manifest and display its details.

    Shows all important fields including metadata, spec, tools, and configuration.

    Example:
        ossa inspect my-agent.ossa.yaml
        ossa inspect my-agent.ossa.yaml --format json
    """
    try:
        manifest = load_manifest(manifest_path)

        if output_format == "json":
            import json

            click.echo(json.dumps(json.loads(manifest.model_dump_json()), indent=2))
            return

        if output_format == "yaml":
            output = export_manifest(manifest, format="yaml")
            syntax = Syntax(output, "yaml", theme="monokai", line_numbers=True)
            console.print(syntax)
            return

        # Table format
        console.print(
            Panel(
                f"[bold]{manifest.metadata.name}[/bold] v{manifest.metadata.version}",
                subtitle=manifest.kind.value,
            )
        )

        # Metadata table
        meta_table = Table(title="Metadata", show_header=False)
        meta_table.add_column("Field", style="cyan")
        meta_table.add_column("Value")

        meta_table.add_row("Name", manifest.metadata.name)
        meta_table.add_row("Version", manifest.metadata.version)
        meta_table.add_row("API Version", manifest.apiVersion)
        if manifest.metadata.description:
            meta_table.add_row("Description", manifest.metadata.description)

        console.print(meta_table)

        # Labels
        if manifest.metadata.labels:
            labels_table = Table(title="Labels", show_header=False)
            labels_table.add_column("Key", style="cyan")
            labels_table.add_column("Value")
            for key, value in manifest.metadata.labels.items():
                labels_table.add_row(key, value)
            console.print(labels_table)

        # Agent spec details
        if manifest.is_agent:
            spec = manifest.spec

            # LLM configuration
            if hasattr(spec, "llm"):
                llm_table = Table(title="LLM Configuration", show_header=False)
                llm_table.add_column("Field", style="cyan")
                llm_table.add_column("Value")

                llm_table.add_row("Provider", spec.llm.provider)
                llm_table.add_row("Model", spec.llm.model)
                if spec.llm.temperature is not None:
                    llm_table.add_row("Temperature", str(spec.llm.temperature))
                if spec.llm.max_tokens is not None:
                    llm_table.add_row("Max Tokens", str(spec.llm.max_tokens))

                console.print(llm_table)

            # Tools
            if hasattr(spec, "tools") and spec.tools:
                tools_table = Table(title="Tools")
                tools_table.add_column("Name", style="cyan")
                tools_table.add_column("Type")
                tools_table.add_column("Description")

                for tool in spec.tools:
                    tools_table.add_row(
                        tool.name,
                        tool.type,
                        tool.description or "",
                    )

                console.print(tools_table)

            # Role/System Prompt
            if hasattr(spec, "role") and spec.role:
                console.print("\n[cyan]System Prompt:[/cyan]")
                role_panel = Panel(spec.role, border_style="dim")
                console.print(role_panel)

    except OSSAError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@main.command()
@click.argument("manifest_path", type=click.Path(exists=True))
@click.option(
    "--format",
    "output_format",
    type=click.Choice(["yaml", "json", "python"]),
    default="yaml",
    help="Export format",
)
@click.option(
    "--output",
    "-o",
    "output_path",
    type=click.Path(),
    help="Output file path (default: stdout)",
)
def export(manifest_path: str, output_format: str, output_path: Optional[str]) -> None:
    """
    Export an OSSA manifest to different formats.

    Convert between YAML, JSON, and Python code representations.

    Example:
        ossa export my-agent.ossa.yaml --format json
        ossa export my-agent.ossa.yaml --format python -o agent.py
    """
    try:
        manifest = load_manifest(manifest_path)
        output = export_manifest(manifest, format=output_format, output_path=output_path)

        if not output_path:
            if output_format in ["yaml", "json"]:
                syntax = Syntax(output, output_format, theme="monokai", line_numbers=True)
                console.print(syntax)
            else:
                click.echo(output)
        else:
            console.print(f"[green]✓[/green] Exported to {output_path}")

    except OSSAError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


@main.command()
@click.argument("manifest_path", type=click.Path(exists=True))
def info(manifest_path: str) -> None:
    """
    Display quick information about an OSSA manifest.

    Shows a summary with name, version, kind, and key configuration details.

    Example:
        ossa info my-agent.ossa.yaml
    """
    try:
        manifest = load_manifest(manifest_path)

        info_text = f"""
[bold cyan]Name:[/bold cyan] {manifest.metadata.name}
[bold cyan]Version:[/bold cyan] {manifest.metadata.version}
[bold cyan]Kind:[/bold cyan] {manifest.kind.value}
[bold cyan]API Version:[/bold cyan] {manifest.apiVersion}
"""

        if manifest.metadata.description:
            info_text += f"\n[bold cyan]Description:[/bold cyan]\n{manifest.metadata.description}\n"

        if manifest.is_agent and hasattr(manifest.spec, "llm"):
            llm = manifest.spec.llm
            info_text += f"\n[bold cyan]LLM:[/bold cyan] {llm.provider}/{llm.model}"

        console.print(Panel(info_text.strip(), title="OSSA Manifest", border_style="cyan"))

    except OSSAError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise click.Abort()


if __name__ == "__main__":
    main()
