package main

import (
	"context"
	"fmt"
	"os"
	"time"

	uadp "github.com/openstandardagents/uadp-go"
)

type testResult struct {
	test   string
	passed bool
	err    string
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: uadp-test <base-url>")
		fmt.Println("Example: uadp-test https://marketplace.example.com")
		os.Exit(1)
	}

	baseURL := os.Args[1]
	fmt.Printf("Running UADP conformance tests against %s...\n\n", baseURL)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client := uadp.NewClient(baseURL, uadp.WithTimeout(15*time.Second))

	var results []testResult

	// Test 1: Discovery
	manifest, err := client.Discover(ctx)
	if err != nil {
		results = append(results, testResult{"GET /.well-known/uadp.json", false, err.Error()})
		printResults(results)
		os.Exit(1)
	}
	results = append(results, testResult{"GET /.well-known/uadp.json", true, ""})

	// Test 2: Skills
	if manifest.Endpoints.Skills != "" {
		skills, err := client.ListSkills(ctx, &uadp.ListParams{Limit: 5})
		if err != nil {
			results = append(results, testResult{"GET /uadp/v1/skills", false, err.Error()})
		} else if skills.Meta.NodeName == "" {
			results = append(results, testResult{"GET /uadp/v1/skills", false, "meta.node_name missing"})
		} else {
			results = append(results, testResult{"GET /uadp/v1/skills", true, ""})
		}
	}

	// Test 3: Agents
	if manifest.Endpoints.Agents != "" {
		agents, err := client.ListAgents(ctx, &uadp.ListParams{Limit: 5})
		if err != nil {
			results = append(results, testResult{"GET /uadp/v1/agents", false, err.Error()})
		} else if agents.Meta.NodeName == "" {
			results = append(results, testResult{"GET /uadp/v1/agents", false, "meta.node_name missing"})
		} else {
			results = append(results, testResult{"GET /uadp/v1/agents", true, ""})
		}
	}

	// Test 4: Federation
	if manifest.Endpoints.Federation != "" {
		fed, err := client.GetFederation(ctx)
		if err != nil {
			results = append(results, testResult{"GET /uadp/v1/federation", false, err.Error()})
		} else if fed.NodeName == "" {
			results = append(results, testResult{"GET /uadp/v1/federation", false, "node_name missing"})
		} else {
			results = append(results, testResult{"GET /uadp/v1/federation", true, ""})
		}
	}

	// Test 5: Pagination
	if manifest.Endpoints.Skills != "" {
		page1, err := client.ListSkills(ctx, &uadp.ListParams{Page: 1, Limit: 1})
		if err != nil {
			results = append(results, testResult{"Pagination (page=1, limit=1)", false, err.Error()})
		} else if page1.Meta.Page != 1 || page1.Meta.Limit != 1 {
			results = append(results, testResult{"Pagination (page=1, limit=1)", false, "pagination params not respected"})
		} else {
			results = append(results, testResult{"Pagination (page=1, limit=1)", true, ""})
		}
	}

	printResults(results)
	for _, r := range results {
		if !r.passed {
			os.Exit(1)
		}
	}
}

func printResults(results []testResult) {
	passed, failed := 0, 0
	for _, r := range results {
		icon := "PASS"
		if !r.passed {
			icon = "FAIL"
			failed++
		} else {
			passed++
		}
		msg := fmt.Sprintf("  [%s] %s", icon, r.test)
		if r.err != "" {
			msg += " -- " + r.err
		}
		fmt.Println(msg)
	}
	fmt.Printf("\n%d passed, %d failed\n", passed, failed)
}
