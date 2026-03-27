import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const MONTHSARY        = 50;
const FIFTEENTH_BUFFER = 50;
const CONTINGENCY      = 70;

function isFifteenthDone(startDateStr) {
  if (!startDateStr) return false;
  const start = new Date(startDateStr);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12
    + (now.getMonth() - start.getMonth());
  return months >= 3;
}

const fmt = (v) => (v || 0).toFixed(2);

function getWeekKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-W${Math.ceil(date.getDate()/7)}`;
}

export default function IncomeAllocationScreen({ navigation }) {
  const { state, actions } = useApp();

  const fifteenthDone = isFifteenthDone(state.fifteenthStartDate);
  const autoDeduct    = fifteenthDone ? MONTHSARY + CONTINGENCY : MONTHSARY + FIFTEENTH_BUFFER + CONTINGENCY;
  const creditTotal    = creditStats?.creditTotalDebt || 4000;
  const creditPaid     = Math.min(state.creditDebtRemaining || 0, creditTotal);
  const creditLeft     = Math.max(0, creditTotal - creditPaid);
  const creditProgress = creditPaid / creditTotal;

  const now            = new Date();
  const currentWeekKey = getWeekKey(now);

  const [income, setIncome]               = useState('');
  const [schoolFund, setSchoolFund]       = useState('');
  const [creditInput, setCreditInput]     = useState('');
  const [bufferTopUp, setBufferTopUp]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [confirmed, setConfirmed]         = useState(false);
  const [creditStats, setCreditStats]     = useState(null);
  const [alreadyLogged, setAlreadyLogged] = useState(false);
  const [checkingLog, setCheckingLog]     = useState(true);

  useEffect(() => {
    const BASE = process.env.EXPO_PUBLIC_API_URL;
    Promise.all([
      fetch(`${BASE}/api/allocate-income/logged-weeks`).then(r => r.json()),
      fetch(`${BASE}/api/credit/monthly`).then(r => r.json()),
    ]).then(([weeks, credit]) => {
      setAlreadyLogged(weeks.some(r => r.week_key === currentWeekKey));
      setCreditStats(credit);
    }).catch(() => {}).finally(() => setCheckingLog(false));
  }, []);

  const weeklyIncome  = parseFloat(income) || 0;
  const extraBuffer   = parseFloat(bufferTopUp) || 0;
  const availablePool = Math.max(0, weeklyIncome - autoDeduct - extraBuffer);
  const schoolCost    = Math.min(parseFloat(schoolFund) || 0, availablePool);
  const maxCredit     = Math.max(0, availablePool - schoolCost);
  const creditPayment = Math.min(parseFloat(creditInput) || 0, maxCredit);
  const sobraAlloc    = Math.max(0, availablePool - schoolCost - creditPayment);
  const canConfirm    = !confirmed && !alreadyLogged;
  const poolColor     = sobraAlloc > 0 ? '#34d399' : availablePool > 0 ? '#f59e0b' : '#6b7280';

  const handleSchoolChange = (val) => {
    const n = parseFloat(val) || 0;
    setSchoolFund(n > availablePool ? String(availablePool) : val);
    const newMax = Math.max(0, availablePool - Math.min(n, availablePool));
    if ((parseFloat(creditInput) || 0) > newMax) setCreditInput(String(newMax));
  };

  const handleCreditChange = (val) => {
    const n = parseFloat(val) || 0;
    setCreditInput(n > maxCredit ? String(maxCredit) : val);
  };

  const handleBufferTopUpChange = (val) => {
    const n = parseFloat(val) || 0;
    const maxTopUp = Math.max(0, weeklyIncome - autoDeduct);
    setBufferTopUp(n > maxTopUp ? String(maxTopUp) : val);
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const BASE = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${BASE}/api/allocate-income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: weeklyIncome,
          monthsary: weeklyIncome > 0 ? MONTHSARY : 0,
          contingency: weeklyIncome > 0 ? CONTINGENCY : 0,
          midMonthDebt: fifteenthDone ? 0 : weeklyIncome > 0 ? FIFTEENTH_BUFFER + extraBuffer : 0,
          lunchCost: schoolCost,
          creditPayment,
          sobraAllocation: sobraAlloc,
          weekKey: currentWeekKey,
          noIncome: weeklyIncome === 0,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      await actions.refreshState?.();
      setConfirmed(true);
      setAlreadyLogged(true);
      Alert.alert('✅ Saved!', 'Your income has been allocated.', [
        { text: 'Back to Dashboard', onPress: () => navigation.navigate('Tabs', { screen: 'Dashboard' }) },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingLog) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  // Already logged this week
  if (alreadyLogged) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.blockedContainer}>
          <Text style={s.blockedIcon}>✅</Text>
          <Text style={s.blockedTitle}>Already logged this week</Text>
          <Text style={s.blockedSub}>
            You've submitted income for Week {Math.ceil(now.getDate()/7)} of{' '}
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}.
            {'\n'}Come back next week.
          </Text>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.navigate('Tabs', { screen: 'Dashboard' })}
          >
            <Text style={s.backBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Weekly Income</Text>
        <Text style={s.sub}>Enter this week's income to allocate funds.</Text>

        {/* Credit Debt Progress */}
        <View style={s.debtCard}>
          <View style={s.debtHeader}>
            <Text style={s.debtTitle}>Credit Debt Progress</Text>
            <Text style={s.debtFraction}>₱{fmt(creditPaid)} / ₱{fmt(creditTotal)}</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.min(creditProgress * 100, 100)}%` }]} />
          </View>
          <Text style={s.debtLeft}>₱{fmt(creditLeft)} remaining</Text>
        </View>

        {/* Income Input */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Total Income This Week</Text>
          <Text style={s.cardSub}>Enter ₱0 if you had no income — it will still be tracked.</Text>
          <View style={s.amtRow}>
            <Text style={s.peso}>₱</Text>
            <TextInput
              style={s.bigInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#4b5563"
              value={income}
              onChangeText={(v) => { setIncome(v); setConfirmed(false); }}
            />
          </View>
        </View>

        {/* Zero income — quick log */}
        {income !== '' && weeklyIncome === 0 && (
          <TouchableOpacity
            style={[s.confirmBtn, loading && s.confirmDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.confirmText}>Log Zero Income Week</Text>
            }
          </TouchableOpacity>
        )}

        {weeklyIncome > 0 && (
          <>
            {/* Auto-Deductions */}
            <View style={s.lockedCard}>
              <Text style={s.lockedTitle}>🔒 Auto-Deducted (₱{autoDeduct})</Text>
              <View style={s.lockedRow}>
                <Text style={s.lockedLabel}>Monthsary Fund</Text>
                <Text style={s.lockedAmt}>₱{MONTHSARY}</Text>
              </View>
              <View style={s.lockedRow}>
                <Text style={s.lockedLabel}>Contingency Fund</Text>
                <Text style={s.lockedAmt}>₱{CONTINGENCY}</Text>
              </View>
              {fifteenthDone ? (
                <View style={s.lockedRow}>
                  <Text style={[s.lockedLabel, { color: '#34d399' }]}>15th Buffer ✓ Complete</Text>
                  <Text style={[s.lockedAmt, { color: '#34d399' }]}>₱0</Text>
                </View>
              ) : (
                <View style={s.lockedRow}>
                  <View>
                    <Text style={s.lockedLabel}>15th Payment Buffer</Text>
                    <Text style={s.lockedSub}>₱50/wk × 4wks × 3mo = ₱600 total</Text>
                  </View>
                  <Text style={s.lockedAmt}>₱{FIFTEENTH_BUFFER}</Text>
                </View>
              )}
            </View>

            {/* Available Pool */}
            <View style={[s.poolCard, { borderColor: poolColor }]}>
              <Text style={s.poolLabel}>Available to Allocate</Text>
              <Text style={[s.poolAmount, { color: poolColor }]}>₱{fmt(availablePool)}</Text>
              <Text style={s.poolSub}>
                {sobraAlloc > 0 ? `₱${fmt(sobraAlloc)} → Savings`
                  : availablePool > 0 ? 'Fully allocated' : 'Allocate below'}
              </Text>
            </View>

            {/* 15th top-up — moved below pool */}
            {!fifteenthDone && (
              <View style={s.card}>
                <Text style={s.cardLabel}>15th Buffer Top-up (Optional)</Text>
                <Text style={s.cardSub}>Add extra if your 15th is coming soon this month.</Text>
                <View style={s.amtRow}>
                  <Text style={s.peso}>₱</Text>
                  <TextInput
                    style={s.bigInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#4b5563"
                    value={bufferTopUp}
                    onChangeText={handleBufferTopUpChange}
                  />
                </View>
                <Text style={s.cardSub}>Total buffer this week: ₱{FIFTEENTH_BUFFER + extraBuffer}</Text>
              </View>
            )}

            {/* School Fund */}
            <View style={s.card}>
              <Text style={s.cardLabel}>School Fund</Text>
              <Text style={s.cardSub}>Weekly school expenses (supplies, fare, etc.)</Text>
              <View style={s.amtRow}>
                <Text style={s.peso}>₱</Text>
                <TextInput
                  style={s.bigInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#4b5563"
                  value={schoolFund}
                  onChangeText={handleSchoolChange}
                />
              </View>
            </View>

            {/* Credit Payment */}
            <View style={s.card}>
              <Text style={s.cardLabel}>Credit Payment</Text>
              {creditStats && (
                <View style={s.creditStats}>
                  <View style={s.creditStatRow}>
                    <Text style={s.creditStatLabel}>Paid this month</Text>
                    <Text style={s.creditStatVal}>₱{fmt(creditStats.paidThisMonth)}</Text>
                  </View>
                  <View style={s.creditStatRow}>
                    <Text style={s.creditStatLabel}>Still needed (₱500 min)</Text>
                    <Text style={[s.creditStatVal, { color: creditStats.stillNeeded > 0 ? '#f59e0b' : '#34d399' }]}>
                      ₱{fmt(creditStats.stillNeeded)}
                    </Text>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, {
                      width: `${Math.min((creditStats.paidThisMonth / 500) * 100, 100)}%`,
                      backgroundColor: creditStats.paidThisMonth >= 500 ? '#34d399' : '#f59e0b',
                    }]} />
                  </View>
                  <View style={s.suggestRow}>
                    <Text style={s.suggestText}>💡 Suggested this week:</Text>
                    <TouchableOpacity
                      onPress={() => setCreditInput(String(creditStats.suggestedWeekly))}
                      style={s.suggestBtn}
                    >
                      <Text style={s.suggestBtnText}>
                        ₱{creditStats.suggestedWeekly} ({creditStats.weeksLeft} wk{creditStats.weeksLeft !== 1 ? 's' : ''} left)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={s.amtRow}>
                <Text style={s.peso}>₱</Text>
                <TextInput
                  style={s.bigInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#4b5563"
                  value={creditInput}
                  onChangeText={handleCreditChange}
                />
              </View>
              <Text style={s.cardSub}>Leave at ₱0 if you can't pay this week — that's okay.</Text>
            </View>

            {/* Savings auto */}
            <View style={[s.card, s.sobraCard]}>
              <Text style={s.cardLabel}>→ Savings (Auto)</Text>
              <Text style={s.sobraAmount}>₱{fmt(sobraAlloc)}</Text>
              <Text style={s.cardSub}>Whatever's left after school fund & credit</Text>
            </View>

            {/* Summary */}
            <View style={s.summaryCard}>
              <Text style={s.summaryTitle}>Allocation Summary</Text>
              {[
                { label: 'Monthsary Fund',   amt: MONTHSARY,                                          color: '#f472b6' },
                { label: 'Contingency Fund', amt: CONTINGENCY,                                        color: '#60a5fa' },
                { label: '15th Buffer',      amt: fifteenthDone ? 0 : FIFTEENTH_BUFFER + extraBuffer, color: '#fb923c' },
                { label: 'School Fund',      amt: schoolCost,                                         color: '#fbbf24' },
                { label: 'Credit Payment',   amt: creditPayment,                                      color: '#f87171' },
                { label: 'Savings',          amt: sobraAlloc,                                         color: '#34d399' },
              ].map(({ label, amt, color }) => (
                <View key={label} style={s.summaryRow}>
                  <Text style={s.summaryLabel}>{label}</Text>
                  <Text style={[s.summaryAmt, { color }]}>₱{fmt(amt)}</Text>
                </View>
              ))}
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: '#fff', fontWeight: '700' }]}>Total</Text>
                <Text style={[s.summaryAmt, { color: '#fff', fontWeight: '700' }]}>
                  ₱{fmt(MONTHSARY + CONTINGENCY + (fifteenthDone ? 0 : FIFTEENTH_BUFFER + extraBuffer) + schoolCost + creditPayment + sobraAlloc)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.confirmBtn, (!canConfirm || loading) && s.confirmDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.confirmText}>{confirmed ? '✓ Saved' : 'Confirm & Save'}</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  container: { padding: 20, paddingBottom: 60 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 14, marginBottom: 20 },

  blockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  blockedIcon: { fontSize: 56, marginBottom: 16 },
  blockedTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  blockedSub: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  debtCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginBottom: 12 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  debtTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  debtFraction: { color: '#9ca3af', fontSize: 13 },
  debtLeft: { color: '#f87171', fontSize: 12, fontWeight: '600' },

  progressBg: { height: 8, backgroundColor: '#2d2d3f', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: '#f87171', borderRadius: 4 },

  card: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardLabel: { color: '#a78bfa', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#4b5563', fontSize: 12, marginBottom: 8, marginTop: 4 },

  amtRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d3f', borderRadius: 12, paddingHorizontal: 14 },
  peso: { color: '#a78bfa', fontSize: 22, fontWeight: '700', marginRight: 6 },
  bigInput: { flex: 1, color: '#fff', fontSize: 28, fontWeight: '700', paddingVertical: 12 },

  lockedCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  lockedTitle: { color: '#9ca3af', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  lockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lockedLabel: { color: '#6b7280', fontSize: 14 },
  lockedSub: { color: '#4b5563', fontSize: 11, marginTop: 2 },
  lockedAmt: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },

  poolCard: { borderRadius: 16, padding: 20, marginBottom: 12, alignItems: 'center', backgroundColor: '#1e1e2e', borderWidth: 2 },
  poolLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 4 },
  poolAmount: { fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  poolSub: { color: '#6b7280', fontSize: 12, marginTop: 4 },

  sobraCard: { borderWidth: 1, borderColor: '#34d399' },
  sobraAmount: { color: '#34d399', fontSize: 32, fontWeight: '800', marginVertical: 4 },

  summaryCard: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryTitle: { color: '#a78bfa', fontWeight: '700', fontSize: 13, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#9ca3af', fontSize: 14 },
  summaryAmt: { fontSize: 14, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#2d2d3f', marginVertical: 8 },

  confirmBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmDisabled: { backgroundColor: '#2d2d3f' },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  creditStats: { marginBottom: 12 },
  creditStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  creditStatLabel: { color: '#6b7280', fontSize: 13 },
  creditStatVal: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap' },
  suggestText: { color: '#6b7280', fontSize: 12 },
  suggestBtn: { backgroundColor: '#2d2d3f', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  suggestBtnText: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
});
