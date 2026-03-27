import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function WindfallModal({ visible, onClose }) {
  const { actions } = useApp();
  const [total, setTotal] = useState('');
  const [debt, setDebt] = useState('0');
  const [sobra, setSobra] = useState('0');
  const [buffer, setBuffer] = useState('0');

  const totalAmount = parseFloat(total) || 0;
  const distributed = (parseFloat(debt) || 0) + (parseFloat(sobra) || 0) + (parseFloat(buffer) || 0);
  const remaining = totalAmount - distributed;
  const isValid = totalAmount > 0 && Math.abs(remaining) < 0.01;

  const handleReset = () => {
    setTotal(''); setDebt('0'); setSobra('0'); setBuffer('0');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    await actions.logWindfall({
      debtCrusher: parseFloat(debt) || 0,
      sobraAmount: parseFloat(sobra) || 0,
      bufferAmount: parseFloat(buffer) || 0,
    });
    handleReset();
    onClose();
  };

  // Quick-fill: put all remaining into a field
  const fillRemaining = (setter, currentVal) => {
    const current = parseFloat(currentVal) || 0;
    setter((current + remaining).toFixed(2).replace(/\.00$/, ''));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Log Windfall</Text>
          <Text style={styles.subtitle}>Enter how much you received, then distribute it.</Text>

          {/* Total amount input */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Received</Text>
            <View style={styles.totalInputWrap}>
              <Text style={styles.peso}>₱</Text>
              <TextInput
                style={styles.totalInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#4b5563"
                value={total}
                onChangeText={(v) => {
                  setTotal(v);
                  setDebt('0'); setSobra('0'); setBuffer('0');
                }}
              />
            </View>
          </View>

          {totalAmount > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.distributeLabel}>Distribute ₱{totalAmount.toFixed(2)}</Text>

              {[
                { label: 'Debt Crusher', sub: 'Pay down credit faster', value: debt, setter: setDebt },
                { label: 'Personal Savings', sub: 'Add to your savings', value: sobra, setter: setSobra },
                { label: '15th Payment Buffer', sub: 'Buffer for next payment', value: buffer, setter: setBuffer },
              ].map(({ label, sub, value, setter }) => (
                <View key={label} style={styles.inputRow}>
                  <View style={styles.inputLabelWrap}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    <Text style={styles.inputSub}>{sub}</Text>
                  </View>
                  <View style={styles.inputRight}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={setter}
                      placeholderTextColor="#4b5563"
                    />
                    {remaining > 0 && (
                      <TouchableOpacity
                        style={styles.fillBtn}
                        onPress={() => fillRemaining(setter, value)}
                      >
                        <Text style={styles.fillBtnText}>+rest</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.remainingRow}>
                <Text style={styles.remainingLabel}>Unallocated</Text>
                <Text style={[styles.remainingAmt, remaining < 0 && styles.over, remaining === 0 && styles.zero]}>
                  ₱{remaining.toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.btnText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.cancel}>
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
  subtitle: { color: '#6b7280', fontSize: 13, marginBottom: 16 },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  totalInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f', borderRadius: 10, paddingHorizontal: 12 },
  peso: { color: '#a78bfa', fontSize: 18, fontWeight: '700', marginRight: 4 },
  totalInput: { color: '#fff', fontSize: 22, fontWeight: '700', paddingVertical: 10, minWidth: 100, textAlign: 'right' },

  divider: { height: 1, backgroundColor: '#2d2d3f', marginVertical: 16 },
  distributeLabel: { color: '#a78bfa', fontSize: 13, fontWeight: '700', marginBottom: 12 },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  inputLabelWrap: { flex: 1 },
  inputLabel: { color: '#e2e8f0', fontSize: 14 },
  inputSub: { color: '#4b5563', fontSize: 11, marginTop: 1 },
  inputRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    backgroundColor: '#2d2d3f', color: '#fff', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, width: 90, textAlign: 'right', fontSize: 15,
  },
  fillBtn: { backgroundColor: '#2d2d3f', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  fillBtnText: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },

  remainingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  remainingLabel: { color: '#6b7280', fontSize: 13 },
  remainingAmt: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
  over: { color: '#f87171' },
  zero: { color: '#34d399' },

  btn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { backgroundColor: '#3b3b52' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancel: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#6b7280', fontSize: 14 },
});
