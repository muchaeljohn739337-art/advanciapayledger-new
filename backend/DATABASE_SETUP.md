# Database Setup Instructions

## Issue: Invalid Database Connection String

The Prisma migration failed because the `DATABASE_URL` in your `.env` file has an invalid port number.

## Fix the Database URL

Open `backend/.env` and update the `DATABASE_URL` to use a valid format:

### Option 1: Local PostgreSQL (Recommended for Development)

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/advancia_payledger"
```

### Option 2: Supabase (If using Supabase)

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Option 3: Digital Ocean Managed Database

```bash
DATABASE_URL="postgresql://[USERNAME]:[PASSWORD]@[HOST]:25060/[DATABASE]?sslmode=require"
```

## Common Issues

### Invalid Port Number
- Port must be a number (e.g., `5432`, `25060`)
- Check for typos or special characters in the port
- Ensure no spaces in the connection string

### Connection String Format
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?[OPTIONS]
```

**Example:**
```
postgresql://myuser:mypassword@localhost:5432/mydb
```

## Steps to Fix

1. **Open your `.env` file:**
   ```bash
   notepad backend\.env
   ```

2. **Find the `DATABASE_URL` line**

3. **Update it with a valid connection string** (see examples above)

4. **Save the file**

5. **Run the migration again:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_wallet_security_models
   ```

## Verify Your Database is Running

### For Local PostgreSQL:
```bash
# Check if PostgreSQL is running
Get-Service postgresql*

# Test connection
psql -U postgres -h localhost -p 5432
```

### For Docker PostgreSQL:
```bash
# Check if container is running
docker ps | Select-String postgres

# Start if not running
docker-compose up -d postgres
```

## After Fixing

Once the database URL is corrected, run:

```bash
cd backend

# Run migration
npx prisma migrate dev --name add_wallet_security_models

# Generate Prisma client
npx prisma generate

# Verify schema
npx prisma db push
```

## Need Help?

If you're still having issues:

1. Check that PostgreSQL is installed and running
2. Verify the port number (default is 5432)
3. Ensure the database exists
4. Check username and password are correct
5. For cloud databases, verify SSL settings

## Example Valid URLs

✅ **Local:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/advancia_payledger"
```

✅ **Supabase:**
```
DATABASE_URL="postgresql://postgres:your-password@db.abcdefghijklm.supabase.co:5432/postgres"
```

✅ **Digital Ocean:**
```
DATABASE_URL="postgresql://doadmin:password@db-postgresql-nyc3-12345.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

❌ **Invalid (missing port):**
```
DATABASE_URL="postgresql://postgres:password@localhost/database"
```

❌ **Invalid (wrong port format):**
```
DATABASE_URL="postgresql://postgres:password@localhost:abc/database"
```

---

**Next Steps After Database Fix:**
1. Fix DATABASE_URL in `.env`
2. Run migration command
3. Uncomment wallet routes in `app.ts`
4. Test the API endpoints
