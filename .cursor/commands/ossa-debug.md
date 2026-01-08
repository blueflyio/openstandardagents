# OSSA Debug Command

Investigates and fixes issues in OSSA codebase.

## Usage
`/ossa-debug [issue-description]`

## Behavior
- Investigates issues thoroughly before proposing fixes
- Uses search tools to understand root cause
- Examines test failures and error logs
- Proposes fixes only after understanding the problem

## Example
```
/ossa-debug "validation service failing on schema v0.2.6"
```

## Tool Usage
- Search tools first (Read File, Codebase, Grep)
- Terminal for running tests and commands
- Edit only after root cause identified

