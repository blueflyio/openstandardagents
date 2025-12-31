## Agent Change

<!-- 💡 Click "Summarize code changes" above to auto-generate from GitLab Duo -->

## Agent

- **Name**:
- **Type**: worker / orchestrator / specialist
- **Path**: `.agents/`

## Checklist

- [ ] `ossa validate .agents/<name>/`
- [ ] Schema: `apiVersion: ossa/v0.3.2`
- [ ] No hardcoded LLM models
- [ ] Tests pass

/label ~"agent" ~"needs-review"
