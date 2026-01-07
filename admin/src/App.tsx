import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { supabase } from './lib/supabase';
import { type User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '100px' }}>Initializing Command Deck...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {user ? <Dashboard /> : <Login />}
    </Layout>
  );
}

export default App;
