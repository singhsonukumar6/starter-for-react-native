/**
 * Test Detail Route - Renders the TestDetailScreen with selected test
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TestDetailScreen from '../../src/screens/TestDetailScreen';

export default function TestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <TestDetailScreen initialTestId={id} />;
}
