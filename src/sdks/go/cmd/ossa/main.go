// OSSA CLI - Go implementation
// Validates and manages OSSA agent manifests
package main

import (
	"fmt"
	"os"

	"github.com/blueflyio/ossa-go/ossa"
	"github.com/spf13/cobra"
)

var (
	schemaPath string
	outputJSON bool
)

func main() {
	rootCmd := &cobra.Command{
		Use:     "ossa",
		Short:   "OSSA CLI - Open Standard for Scalable AI Agents",
		Long:    `OSSA CLI validates and manages AI agent manifests.\n\nVersion: ` + ossa.Version + ` (OSSA ` + ossa.OSSAVersion + `)`,
		Version: ossa.Version,
	}

	// Validate command
	validateCmd := &cobra.Command{
		Use:   "validate [manifest]",
		Short: "Validate an OSSA manifest",
		Long:  `Validates an OSSA manifest against the JSON Schema specification.`,
		Args:  cobra.ExactArgs(1),
		RunE:  runValidate,
	}
	validateCmd.Flags().StringVarP(&schemaPath, "schema", "s", "", "Path to custom schema (defaults to embedded v0.3.3)")
	validateCmd.Flags().BoolVarP(&outputJSON, "json", "j", false, "Output as JSON")

	// Info command
	infoCmd := &cobra.Command{
		Use:   "info [manifest]",
		Short: "Display manifest information",
		Long:  `Loads and displays information about an OSSA manifest.`,
		Args:  cobra.ExactArgs(1),
		RunE:  runInfo,
	}
	infoCmd.Flags().BoolVarP(&outputJSON, "json", "j", false, "Output as JSON")

	// Version command is built-in via rootCmd.Version

	rootCmd.AddCommand(validateCmd)
	rootCmd.AddCommand(infoCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func runValidate(cmd *cobra.Command, args []string) error {
	path := args[0]

	var result *ossa.ValidationResult
	var err error

	if schemaPath != "" {
		result, err = ossa.ValidateFile(path, schemaPath)
	} else {
		result, err = ossa.ValidateFile(path, "")
	}

	if err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	if outputJSON {
		// JSON output
		if result.Valid {
			fmt.Println(`{"valid": true}`)
		} else {
			fmt.Printf(`{"valid": false, "errors": %d}`, len(result.Errors))
			fmt.Println()
		}
		return nil
	}

	// Human-readable output
	if result.Valid {
		fmt.Printf("✅ %s is valid\n", path)
		return nil
	}

	fmt.Printf("❌ %s is invalid (%d errors)\n", path, len(result.Errors))
	for _, e := range result.Errors {
		fmt.Printf("  • %s: %s\n", e.Path, e.Message)
	}
	return fmt.Errorf("validation failed")
}

func runInfo(cmd *cobra.Command, args []string) error {
	path := args[0]

	manifest, err := ossa.LoadManifest(path)
	if err != nil {
		return fmt.Errorf("failed to load manifest: %w", err)
	}

	if outputJSON {
		data, err := manifest.ToJSON()
		if err != nil {
			return err
		}
		fmt.Println(string(data))
		return nil
	}

	// Human-readable output
	fmt.Printf("Name:        %s\n", manifest.Metadata.Name)
	fmt.Printf("Kind:        %s\n", manifest.Kind)
	fmt.Printf("API Version: %s\n", manifest.APIVersion)

	if manifest.Metadata.Version != "" {
		fmt.Printf("Version:     %s\n", manifest.Metadata.Version)
	}
	if manifest.Metadata.Description != "" {
		fmt.Printf("Description: %s\n", manifest.Metadata.Description)
	}
	if tier := manifest.GetAccessTier(); tier != "" {
		fmt.Printf("Access Tier: %s\n", tier)
	}
	if manifest.Spec.LLM != nil {
		fmt.Printf("LLM:         %s/%s\n", manifest.Spec.LLM.Provider, manifest.Spec.LLM.Model)
	}
	if len(manifest.Spec.Tools) > 0 {
		fmt.Printf("Tools:       %d\n", len(manifest.Spec.Tools))
	}

	return nil
}
