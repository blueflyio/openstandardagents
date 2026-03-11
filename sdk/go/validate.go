package uadp

import "fmt"

// ValidateManifestData validates a /.well-known/uadp.json manifest map.
func ValidateManifestData(m map[string]interface{}) *ValidationResult {
	var errors []string
	var warnings []string

	pv, ok := m["protocol_version"].(string)
	if !ok || pv == "" {
		errors = append(errors, "protocol_version is required")
	}

	nn, ok := m["node_name"].(string)
	if !ok || nn == "" {
		errors = append(errors, "node_name is required")
	}

	ep, ok := m["endpoints"].(map[string]interface{})
	if !ok {
		errors = append(errors, "endpoints is required")
	} else {
		_, hasSkills := ep["skills"]
		_, hasAgents := ep["agents"]
		if !hasSkills && !hasAgents {
			errors = append(errors, "endpoints must include at least one of: skills, agents")
		}
	}

	if _, ok := m["node_description"]; !ok {
		warnings = append(warnings, "node_description is recommended")
	}

	return &ValidationResult{
		Valid:    len(errors) == 0,
		Errors:   errors,
		Warnings: warnings,
	}
}

// ValidateResponseData validates a UADP skills/agents response envelope.
func ValidateResponseData(r map[string]interface{}) *ValidationResult {
	var errors []string

	data, ok := r["data"].([]interface{})
	if !ok {
		errors = append(errors, "data must be an array")
	} else {
		for i, item := range data {
			m, ok := item.(map[string]interface{})
			if !ok {
				errors = append(errors, fmt.Sprintf("data[%d] must be an object", i))
				continue
			}
			if _, ok := m["apiVersion"]; !ok {
				errors = append(errors, fmt.Sprintf("data[%d].apiVersion is required", i))
			}
			if _, ok := m["kind"]; !ok {
				errors = append(errors, fmt.Sprintf("data[%d].kind is required", i))
			}
			meta, ok := m["metadata"].(map[string]interface{})
			if !ok {
				errors = append(errors, fmt.Sprintf("data[%d].metadata is required", i))
			} else if _, ok := meta["name"]; !ok {
				errors = append(errors, fmt.Sprintf("data[%d].metadata.name is required", i))
			}
		}
	}

	meta, ok := r["meta"].(map[string]interface{})
	if !ok {
		errors = append(errors, "meta is required")
	} else {
		if _, ok := meta["total"].(float64); !ok {
			errors = append(errors, "meta.total must be a number")
		}
		if _, ok := meta["page"].(float64); !ok {
			errors = append(errors, "meta.page must be a number")
		}
		if _, ok := meta["limit"].(float64); !ok {
			errors = append(errors, "meta.limit must be a number")
		}
		if _, ok := meta["node_name"].(string); !ok {
			errors = append(errors, "meta.node_name must be a string")
		}
	}

	return &ValidationResult{
		Valid:  len(errors) == 0,
		Errors: errors,
	}
}
