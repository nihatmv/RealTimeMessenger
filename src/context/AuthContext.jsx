import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(undefined);

  // Sign up
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      console.log('There is some error on signing up: ', error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Sign In
  const signInNewUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error('error occured while sign in: ', error);
        return { success: false, error: error.message };
      }
      console.log('sign-in success', data);
      return { success: true, data };
    } catch (error) {
      console.error('error occured: ', error);
      return { success: false, error: error.message };
    }
  };

  // SignOut
  const signOut = () => {
    const { error } = supabase.auth.signOut();
    if (error) {
      console.log('There is an error: ', error);
    }
  };

  async function fetchUsername(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching username:', error);
      setUsername(undefined);
    } else {
      setUsername(data?.username);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        username,
        signUpNewUser,
        signOut,
        fetchUsername,
        signInNewUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
