import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function PhaseToggle() {
  const { state, dispatch } = useApp();

  return (
    <View style={styles.container}>
      {[1, 2].map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.btn, state.phase === p && styles.active]}
          onPress={() => dispatch({ type: 'SET_PHASE', payload: p })}
        >
          <Text style={[styles.label, state.phase === p && styles.activeLabel]}>
            {p === 1 ? 'Phase 1 (Wk 1-2)' : 'Phase 2 (Wk 3-4)'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#1e1e2e', borderRadius: 12, padding: 4 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  active: { backgroundColor: '#7c3aed' },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  activeLabel: { color: '#fff' },
});
