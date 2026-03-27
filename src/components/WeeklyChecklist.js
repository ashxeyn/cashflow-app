import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { AUTO_SOBRA } from '../constants/budget';

export default function WeeklyChecklist() {
  const { state, actions } = useApp();

  if (!state.checklistActive) return null;

  const allChecked = state.checklist.every((i) => i.checked);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly Allocation Checklist</Text>
      {state.checklist.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.row}
          onPress={() => actions.toggleItem(item.id)}
        >
          <View style={[styles.checkbox, item.checked && styles.checked]}>
            {item.checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.itemLabel, item.checked && styles.strikethrough]}>
            {item.label}
          </Text>
          <Text style={styles.amount}>₱{item.amount}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.sobraLabel}>→ Auto Savings</Text>
        <Text style={[styles.amount, styles.sobraAmount]}>₱{AUTO_SOBRA}</Text>
      </View>
      {allChecked && (
        <Text style={styles.doneMsg}>All allocated! ₱{AUTO_SOBRA} saved to Savings.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginTop: 16 },
  title: { color: '#a78bfa', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#7c3aed', marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checked: { backgroundColor: '#7c3aed' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemLabel: { flex: 1, color: '#e2e8f0', fontSize: 14 },
  strikethrough: { textDecorationLine: 'line-through', color: '#4b5563' },
  amount: { color: '#a78bfa', fontWeight: '600', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#2d2d3f', marginVertical: 8 },
  sobraLabel: { flex: 1, color: '#34d399', fontSize: 14, fontStyle: 'italic' },
  sobraAmount: { color: '#34d399' },
  doneMsg: { color: '#34d399', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
