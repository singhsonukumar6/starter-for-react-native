/**
 * Weekly Test Route - Redirects to Tests & Contests page
 * Tests are now unified under the Tests & Contests screen
 */
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Loading } from '../src/components/Loading';

export default function WeeklyTestRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/tests-contests');
  }, []);

  return <Loading message="Loading tests..." />;
}
