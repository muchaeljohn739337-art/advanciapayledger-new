import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have an AuthContext

const withAdminAuth = (WrappedComponent: React.ComponentType<any>) => {
  const Wrapper = (props: any) => {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
      if (!loading && (!user || user.role !== 'ADMIN')) {
        router.push('/login'); // Redirect to login if not an admin
      }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'ADMIN') {
      return <div>Loading...</div>; // Or a proper loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAdminAuth;
