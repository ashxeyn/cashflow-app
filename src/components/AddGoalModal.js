import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';

export default function AddGoalModal({ visible, onAdd, onClose }) {
  const [label, setLabel] = useState('');
  const [goal, setGoal]   = useState('');

  const handleAdd = () => {
    const g = parseFloat(goal);
    if (!label.trim() || isNaN(g) || g <= 0) {
      Alert.alert('Invalid', 'Enter a valid goal name and amount.');
      return;
    }
    onAdd(label.trim(), g);
    setLabel('');
    setGoal('');
  };

  const handleClose = () => {
    setLabel('');
    setGoal('');
    onClose();
  };

  const isValid = label.trim().length > 0 && parseFloat(goal) > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.overlay}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>New Savings Goal</Text>
          <Text style={s.subtitle}>Set a target to start saving towards</Text>

          <Text style={s.label}>Goal Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., oil-control facial wash, new shoes..."
            placeholderTextColor="#4b5563"
            value={label}
            onChangeText={setLabel}
            autoFocus
          />

          <Text style={s.label}>Target Amount</Text>
          <View style={s.amtRow}>
            <Text style={s.peso}>₱</Text>
            <TextInput
              style={s.amtInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#4b5563"
              value={goal}
              onChangeText={setGoal}
            />
          </View>

          <TouchableOpacity
            style={[s.addBtn, !isValid && s.btnDisabled]}
            onPress={handleAdd}
            disabled={!isValid}
          >
            <Text style={s.addBtnText}>+ Add Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={s.cancel}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1e1e2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#3f3f5a', alignSelf: 'center', marginBottom: 18,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#6b7280', fontSize: 13, marginBottom: 22 },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#2d2d3f', color: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16,
  },
  amtRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f',
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 24,
  },
  peso: { color: '#a78bfa', fontSize: 22, fontWeight: '700', marginRight: 6 },
  amtInput: { flex: 1, color: '#fff', fontSize: 24, fontWeight: '700', paddingVertical: 12 },
  addBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginBottom: 4,
  },
  btnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: '#6b7280', fontSize: 14 },
});
