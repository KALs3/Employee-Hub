import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NewRequestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Request</Text>
      <Text style={styles.subtitle}>Submit a leave, equipment, or IT request</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});
