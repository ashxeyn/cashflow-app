import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import CalendarStrip from '../components/CalendarStrip';
import WindfallModal from '../components/WindfallModal';
import SpendModal from '../components/SpendModal';

const fmt = (v) => (v || 0).toFixed(2);

export default function DashboardScreen({ navigation }) {
  const { state, actions, allocatedFunds, totalBalance } = useApp();
  const [windfallVisible, setWindfallVisible] = useState(false);
  const [spendVisible, setSpendVisible]       = useState(false);
  const [creditData, setCreditData]           = useState(null);
  const [editingDebt, setEditingDebt]         = useState(false);
  const [newDebtInput, setNewDebtInput]       = useState('');

  const BASE = process.env.EXPO_PUBLIC_API_URL;

  const fetchCredit = () => {
    fetch(`${BASE}/api/credit/monthly`)
      .then(r => r.json())
      .then(setCreditData)
      .catch(() => {});
  };

  useEffect(() => { fetchCredit(); }, []);

  const handleSaveDebt = async () => {
    const val = parseFloat(newDebtInput);
    if (isNaN(val) || val <= 0) return;

    try {
      if (isDebtFree) {
        await api.updateCreditTotal(val, true);
        setEditingDebt(false);
        fetchCredit();
      } else {
        // Simple confirmation for web/iOS
        // On web, Alert.alert with 3 buttons is often unreliable. 
        // We'll ask "Is this a new debt?"
        if (Platform.OS === 'web') {
          const isNew = window.confirm('Is this a brand new debt (Reset progress to ₱0)? OK for New, Cancel for Just a Correction.');
          await api.updateCreditTotal(val, isNew);
          setEditingDebt(false);
          fetchCredit();
        } else {
          Alert.alert(
            'Update Debt',
            'Is this a new debt or correcting the current total?',
            [
              {
                text: 'New Debt (reset)',
                onPress: async () => {
                  await api.updateCreditTotal(val, true);
                  setEditingDebt(false);
                  fetchCredit();
                },
              },
              {
                text: 'Correction only',
                onPress: async () => {
                  await api.updateCreditTotal(val, false);
                  setEditingDebt(false);
                  fetchCredit();
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      }
    } catch (e) {
      console.error('Failed to update debt', e);
      if (Platform.OS === 'web') window.alert('Failed to update debt: ' + e.message);
    }
  };

  const creditTotal    = creditData?.creditTotalDebt || 4000;
  const creditPaid     = Math.min(creditData?.creditPaidTotal || 0, creditTotal);
  const creditLeft     = Math.max(0, creditTotal - creditPaid);
  const creditProgress = creditTotal > 0 ? creditPaid / creditTotal : 0;
  const isDebtFree     = creditLeft === 0 && creditTotal > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Cash Flow</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₱{fmt(totalBalance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceSub}>
              <Text style={styles.subLabel}>Allocated</Text>
              <Text style={styles.subAmount}>₱{fmt(allocatedFunds)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.balanceSub}>
              <Text style={styles.subLabel}>Savings</Text>
              <Text style={[styles.subAmount, styles.sobraColor]}>
                ₱{fmt(state.sobraBalance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Fund Breakdown */}
        <View style={styles.fundsCard}>
          <Text style={styles.sectionTitle}>Fund Breakdown</Text>
          {[
            { label: 'Contingency Fund',    value: state.contingencyTotal,    color: '#60a5fa' },
            { label: 'Monthsary Fund',      value: state.monthsaryTotal,      color: '#f472b6' },
            { label: 'Goal Savings',
              display: `₱${fmt(state.sobraWishlist.reduce((s, i) => s + (i.funded || 0), 0))} / ₱${fmt(state.sobraWishlist.reduce((s, i) => s + (i.goal || 0), 0))}`,
              color: '#34d399' },
          ].map(({ label, value, display, color }) => (
            <View key={label} style={styles.fundRow}>
              <Text style={styles.fundLabel}>{label}</Text>
              <Text style={[styles.fundValue, { color }]}>{display || `₱${fmt(value)}`}</Text>
            </View>
          ))}
        </View>

        {/* Credit Debt Progress */}
        {isDebtFree ? (
          <View style={[styles.creditCard, styles.creditCardFree]}>
            <Text style={styles.creditFreeIcon}>🎉</Text>
            <Text style={styles.creditFreeTitle}>Debt Free!</Text>
            <Text style={styles.creditFreeSub}>You've paid off your ₱{fmt(creditTotal)} credit debt.</Text>
            <TouchableOpacity
              style={styles.addDebtBtn}
              onPress={() => { setNewDebtInput(''); setEditingDebt(true); }}
            >
              <Text style={styles.addDebtBtnText}>+ Add New Debt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.creditCard}>
            <View style={styles.creditHeader}>
              <Text style={styles.creditTitle}>Credit Debt</Text>
              <TouchableOpacity onPress={() => { setNewDebtInput(String(creditTotal)); setEditingDebt(true); }}>
                <Text style={styles.creditEdit}>✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.creditAmtRow}>
              <Text style={styles.creditPaidAmt}>₱{fmt(creditPaid)}</Text>
              <Text style={styles.creditTotalAmt}> / ₱{fmt(creditTotal)}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(creditProgress * 100, 100)}%` }]} />
            </View>
            <View style={styles.creditFooter}>
              <Text style={styles.creditLeft}>₱{fmt(creditLeft)} remaining</Text>
              <Text style={styles.creditPct}>{Math.round(creditProgress * 100)}% paid</Text>
            </View>
          </View>
        )}

        {/* Edit Debt Modal */}
        <Modal visible={editingDebt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Update Total Credit Debt</Text>
              <Text style={styles.modalSub}>Enter your actual total credit debt amount.</Text>
              <View style={styles.modalInputRow}>
                <Text style={styles.modalPeso}>₱</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={newDebtInput}
                  onChangeText={setNewDebtInput}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={styles.modalBtn} onPress={handleSaveDebt}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingDebt(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Calendar & Phase */}
        <CalendarStrip />

        {/* Action Buttons */}
        <TouchableOpacity style={styles.incomeBtn} onPress={() => navigation.navigate('IncomeAllocation')}>
          <Text style={styles.incomeBtnText}> Log Weekly Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.windfallBtn}
          onPress={() => setWindfallVisible(true)}
        >
          <Text style={styles.windfallBtnText}> Log Windfall</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.spendBtn}
          onPress={() => setSpendVisible(true)}
        >
          <Text style={styles.spendBtnText}> Spend / Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            const msg = 'Factory Reset: This will PERMANENTLY delete all history, savings, and reset all balances to ₱0. Are you absolutely sure?';
            if (Platform.OS === 'web') {
              if (window.confirm(msg)) {
                api.resetAllData().then(() => {
                  actions.refreshState();
                  fetchCredit();
                  window.alert('Database cleared!');
                });
              }
            } else {
              Alert.alert('RESET ALL DATA', msg, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'RESET EVERYTHING', style: 'destructive', onPress: async () => {
                  await api.resetAllData();
                  actions.refreshState();
                  fetchCredit();
                }}
              ]);
            }
          }}
        >
          <Text style={styles.resetBtnText}>Clear All App Data (Reset)</Text>
        </TouchableOpacity>

        <WindfallModal 
          visible={windfallVisible} 
          onClose={() => {
            setWindfallVisible(false);
            fetchCredit();
            actions.refreshState?.();
          }} 
        />
        <SpendModal 
          visible={spendVisible} 
          onClose={() => {
            setSpendVisible(false);
            fetchCredit();
            actions.refreshState?.();
          }} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  container: { padding: 20, paddingBottom: 40 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 20 },

  balanceCard: { backgroundColor: '#7c3aed', borderRadius: 20, padding: 24, marginBottom: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 38, fontWeight: '800', marginBottom: 16 },
  balanceRow: { flexDirection: 'row' },
  balanceSub: { flex: 1, alignItems: 'center' },
  separator: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  subLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  subAmount: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sobraColor: { color: '#a7f3d0' },

  fundsCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#a78bfa', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  fundRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fundLabel: { color: '#9ca3af', fontSize: 14 },
  fundValue: { fontWeight: '600', fontSize: 14 },

  incomeBtn: {
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  incomeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  windfallBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#7c3aed',
  },
  windfallBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 15 },
  spendBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#f87171',
  },
  spendBtnText: { color: '#f87171', fontWeight: '600', fontSize: 15 },

  resetBtn: {
    paddingVertical: 12, alignItems: 'center', marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)', borderRadius: 12,
  },
  resetBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600', opacity: 0.8 },

  creditCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginBottom: 16 },
  creditCardFree: { borderWidth: 1, borderColor: '#34d399', alignItems: 'center', paddingVertical: 20 },
  creditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  creditTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  creditEdit: { color: '#6b7280', fontSize: 12 },
  creditAmtRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  creditPaidAmt: { color: '#fff', fontSize: 22, fontWeight: '800' },
  creditTotalAmt: { color: '#6b7280', fontSize: 14 },
  progressBg: { height: 8, backgroundColor: '#2d2d3f', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#f87171', borderRadius: 4 },
  creditFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  creditLeft: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  creditPct: { color: '#6b7280', fontSize: 12 },
  creditFreeIcon: { fontSize: 36, marginBottom: 8 },
  creditFreeTitle: { color: '#34d399', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  creditFreeSub: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  addDebtBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: '#7c3aed' },
  addDebtBtnText: { color: '#a78bfa', fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1e1e2e', borderRadius: 20, padding: 24, width: '80%' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalSub: { color: '#6b7280', fontSize: 13, marginBottom: 16 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  modalPeso: { color: '#a78bfa', fontSize: 20, fontWeight: '700', marginRight: 6 },
  modalInput: { flex: 1, color: '#fff', fontSize: 24, fontWeight: '700', paddingVertical: 10 },
  modalBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center' },
  modalCancelText: { color: '#6b7280', fontSize: 14 },
});
