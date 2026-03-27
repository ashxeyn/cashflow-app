import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

export default function WithdrawGoalModal({ visible, goal, onUsed, onReturn, onClose }) {
  const [amount, setAmount] = useState('');

  if (!goal) return null;

  const handleUsed = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onUsed(amt);
    setAmount('');
  };

  const handleReturn = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onReturn(amt);
    setAmount('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.overlay}
      >
        <View style={s.sheet}>
          <Text style={s.title}>{goal.label}</Text>
          <Text style={s.sub}>₱{(goal.funded || 0).toFixed(2)} saved of ₱{(goal.goal || 0).toFixed(2)}</Text>

          <Text style={s.label}>Amount</Text>
          <View style={s.amtRow}>
            <Text style={s.peso}>₱</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#4b5563"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btn, s.usedBtn, !amount && s.btnDisabled]}
              onPress={handleUsed}
              disabled={!amount}
            >
              <Text style={s.btnText}>Used</Text>
              <Text style={s.btnSub}>money is spent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.returnBtn, !amount && s.btnDisabled]}
              onPress={handleReturn}
              disabled={!amount}
            >
              <Text style={s.btnText}>Return</Text>
              <Text style={s.btnSub}>back to savings</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={s.cancel}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 2 },
  sub: { color: '#6b7280', fontSize: 13, marginBottom: 20 },
  label: { color: '#6b7280', fontSize: 12, marginBottom: 6 },
  amtRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f',
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 20,
  },
  peso: { color: '#a78bfa', fontSize: 22, fontWeight: '700', marginRight: 6 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: '700', paddingVertical: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  usedBtn: { backgroundColor: '#7f1d1d' },
  returnBtn: { backgroundColor: '#1e3a5f' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  cancel: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: '#6b7280', fontSize: 14 },
});
