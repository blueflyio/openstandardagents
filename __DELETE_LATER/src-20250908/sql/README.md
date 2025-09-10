# OSSA SQL Scripts

Database initialization and migration scripts for OSSA v0.1.8

## Structure

- `migrations/` - Database migration scripts
- `schema/` - Database schema definitions
- `federation/` - Federation-specific database scripts
- `test-data/` - Test data for development environments

## Usage

```bash
# Initialize OSSA database schema
psql -d ossa -f schema/ossa-core.sql

# Run migrations
for migration in migrations/*.sql; do
  psql -d ossa -f "$migration"
done

# Load federation schema
psql -d ossa -f federation/federation-init.sql
```

## Schema Guidelines

- All tables prefixed with `ossa_`
- Use snake_case for column names
- Include proper indexes for performance
- Follow PostgreSQL best practices