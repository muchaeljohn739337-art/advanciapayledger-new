# Supabase Integration Setup

This guide explains how to integrate Supabase authentication and database features into Advancia PayLedger.

## Quick Start

### 1. Install Dependencies

Dependencies are already added to `package.json`. Install them:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your Supabase credentials:

```bash
# Backend (.env)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Authentication Integration

### Backend Authentication

The backend uses the service role key for admin operations:

```typescript
// backend/src/config/supabase.ts
import { supabase } from '../config/supabase';

// Verify user token
export const verifySupabaseToken = async (token: string) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return user;
};

// Create user
export const createUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;
  return data;
};
```

### Frontend Authentication

Use Supabase client for user authentication:

```typescript
// Example: Login component
import { supabase } from '@/lib/supabase';

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('Login error:', error);
    return;
  }
  
  // Store session or redirect
  console.log('Logged in:', data.user);
};

// Example: Signup
const handleSignup = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) {
    console.error('Signup error:', error);
    return;
  }
  
  console.log('Signed up:', data.user);
};

// Example: Logout
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout error:', error);
};

// Example: Get current session
const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
```

## Database Integration

### Option 1: Use Supabase as Primary Database

Update your `DATABASE_URL` to use Supabase PostgreSQL:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Then run Prisma migrations:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Option 2: Use Supabase alongside Prisma

Keep your existing database and use Supabase for specific features:

```typescript
// Store user profiles in Supabase
const createUserProfile = async (userId: string, profile: any) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      ...profile
    });
  
  if (error) throw error;
  return data;
};

// Query user profiles
const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
};
```

## Storage Integration

Use Supabase Storage for file uploads (alternative to Digital Ocean Spaces):

```typescript
// Upload file to Supabase Storage
const uploadToSupabase = async (file: File, bucket: string = 'uploads') => {
  const fileName = `${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Delete file from Supabase Storage
const deleteFromSupabase = async (fileName: string, bucket: string = 'uploads') => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);
  
  if (error) throw error;
};
```

## Real-time Features

Enable real-time subscriptions for live updates:

```typescript
// Subscribe to database changes
const subscribeToTransactions = (userId: string, callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

// Unsubscribe
const unsubscribe = (subscription: any) => {
  supabase.removeChannel(subscription);
};
```

## Row Level Security (RLS)

Set up RLS policies in Supabase dashboard:

```sql
-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Middleware for Protected Routes

Create authentication middleware:

```typescript
// backend/src/middleware/supabaseAuth.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

Use in routes:

```typescript
import { authenticateSupabase } from '../middleware/supabaseAuth';

router.get('/protected', authenticateSupabase, (req, res) => {
  res.json({ user: req.user });
});
```

## Frontend Auth Context

Create a React context for authentication:

```typescript
// frontend/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Testing

Test Supabase connection:

```bash
# Backend test
cd backend
npm run dev

# Test endpoint
curl http://localhost:3001/api/health

# Frontend test
cd frontend
npm run dev
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
