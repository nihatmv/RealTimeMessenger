import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider
      value={{ session, loading, signUpNewUser, signOut, signInNewUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
