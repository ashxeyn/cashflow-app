import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const FUNDS = [
  { key: 'contingency', label: 'Contingency Fund',  color: '#60a5fa', stateKey: 'contingencyTotal' },
  { key: 'savings',     label: 'Savings',            color: '#34d399', stateKey: 'sobraBalance' },
  { key: 'monthsary',  label: 'Monthsary Fund',     color: '#f472b6', stateKey: 'monthsaryTotal' },
];

export default function SpendModal({ visible, onClose }) {
  const { state, actions } = useApp();
  const [selectedFund, setSelectedFund] = useState('contingency');
  const [amount, setAmount]             = useState('');
  const [note, setNote]                 = useState('');
  const [loading, setLoading]           = useState(false);

  const fund    = FUNDS.find(f => f.key === selectedFund);
  const balance = state[fund.stateKey] || 0;

  const handleSpend = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > balance) {
      Alert.alert('Insufficient', `Only ₱${balance.toFixed(2)} available in ${fund.label}`);
      return;
    }
    setLoading(true);
    try {
      await actions.spendFromFund(selectedFund, amt, note.trim() || undefined);
      setAmount(''); setNote('');
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Spend / Withdraw</Text>
          <Text style={styles.sub}>Deduct money you've used from a fund.</Text>

          {/* Fund selector */}
          <View style={styles.fundRow}>
            {FUNDS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.fundBtn, selectedFund === f.key && { borderColor: f.color, backgroundColor: `${f.color}22` }]}
                onPress={() => setSelectedFund(f.key)}
              >
                <Text style={[styles.fundBtnText, selectedFund === f.key && { color: f.color }]}>
                  {f.label}
                </Text>
                <Text style={[styles.fundBalance, { color: f.color }]}>
                  ₱{(state[f.stateKey] || 0).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amtRow}>
            <Text style={styles.peso}>₱</Text>
            <TextInput
              style={styles.amtInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#4b5563"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Note */}
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g., commute fare, bought facial wash..."
            placeholderTextColor="#4b5563"
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity
            style={[styles.btn, (!amount || loading) && styles.btnDisabled]}
            onPress={handleSpend}
            disabled={!amount || loading}
          >
            <Text style={styles.btnText}>Confirm Spend</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#1e1e2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 13, marginBottom: 16 },

  fundRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  fundBtn: {
    flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#2d2d3f',
    padding: 10, alignItems: 'center',
  },
  fundBtnText: { color: '#9ca3af', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  fundBalance: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  label: { color: '#6b7280', fontSize: 12, marginBottom: 6 },
  amtRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f',
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 14,
  },
  peso: { color: '#a78bfa', fontSize: 22, fontWeight: '700', marginRight: 6 },
  amtInput: { flex: 1, color: '#fff', fontSize: 28, fontWeight: '700', paddingVertical: 10 },
  noteInput: {
    backgroundColor: '#2d2d3f', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16,
  },
  btn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#2d2d3f' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancel: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#6b7280', fontSize: 14 },
});
