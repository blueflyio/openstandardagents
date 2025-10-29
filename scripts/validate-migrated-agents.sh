#!/bin/bash
# Validate all migrated OSSA v0.2.2 agents

cd /Users/flux423/Sites/LLM/OSSA

echo "Validating all migrated OSSA v0.2.2 agents..."
echo ""

total=0
valid=0
invalid=0

for file in $(find /Users/flux423/Sites/LLM -name "*.v0.2.2.ossa.yaml" 2>/dev/null); do
  total=$((total + 1))
  echo -n "Validating: $(basename $(dirname $file))/$(basename $file)... "
  
  result=$(node bin/ossa validate "$file" 2>&1 | grep -c "valid OSSA 0.2.2")
  
  if [ "$result" -gt 0 ]; then
    echo "✓ Valid"
    valid=$((valid + 1))
  else
    echo "✗ Invalid"
    invalid=$((invalid + 1))
  fi
done

echo ""
echo "Validation Summary:"
echo "  Total migrated: $total"
echo "  Valid: $valid"
echo "  Invalid: $invalid"

exit $invalid

