import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import DatePickerModal from '../components/DatePickerModal';

const TYPE_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'income',    label: 'Income' },
  { key: 'spend',     label: 'Spent' },
  { key: 'no_income', label: 'No Income' },
];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatDateShort = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const TYPE_CONFIG = {
  income:    { icon: '💰', color: '#34d399', sign: '+' },
  spend:     { icon: '💸', color: '#f87171', sign: '-' },
  no_income: { icon: '⏸️', color: '#6b7280', sign: '' },
};

export default function HistoryScreen() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [typeFilter, setTypeFilter]     = useState('all');
  const [fromDate, setFromDate]         = useState('');
  const [toDate, setToDate]             = useState('');
  const [pickerTarget, setPickerTarget] = useState(null); // 'from' | 'to' | null

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setAllTransactions(data);
    } catch (e) {
      console.warn('Failed to load transactions:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side filtering
  const filtered = allTransactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (fromDate) {
      const txDate = tx.created_at.split('T')[0];
      if (txDate < fromDate) return false;
    }
    if (toDate) {
      const txDate = tx.created_at.split('T')[0];
      if (txDate > toDate) return false;
    }
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, tx) => {
    const dateKey = formatDate(tx.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([date, items]) => ({ date, items }));

  const totalIn  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalOut = filtered.filter(t => t.type === 'spend').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const hasFilters = typeFilter !== 'all' || fromDate || toDate;

  const clearFilters = () => {
    setTypeFilter('all');
    setFromDate('');
    setToDate('');
  };

  const handleDateSelect = (ymd) => {
    if (pickerTarget === 'from') setFromDate(ymd);
    else if (pickerTarget === 'to') setToDate(ymd);
    setPickerTarget(null);
  };

  const renderTransaction = (tx) => {
    const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.spend;
    const amt = parseFloat(tx.amount || 0);

    return (
      <View key={tx.id} style={s.txRow}>
        <Text style={s.txIcon}>{cfg.icon}</Text>
        <View style={s.txInfo}>
          <Text style={s.txLabel} numberOfLines={1}>{tx.label}</Text>
          <Text style={s.txTime}>{formatTime(tx.created_at)}</Text>
        </View>
        <Text style={[s.txAmount, { color: cfg.color }]}>
          {cfg.sign}₱{amt.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.headerRow}>
          <Text style={s.heading}>History</Text>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} style={s.clearBtn}>
              <Text style={s.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, s.summaryIn]}>
            <Text style={s.summaryLabel}>Total In</Text>
            <Text style={[s.summaryAmt, { color: '#34d399' }]}>₱{totalIn.toFixed(2)}</Text>
          </View>
          <View style={[s.summaryCard, s.summaryOut]}>
            <Text style={s.summaryLabel}>Total Out</Text>
            <Text style={[s.summaryAmt, { color: '#f87171' }]}>₱{totalOut.toFixed(2)}</Text>
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={s.dateRow}>
          <TouchableOpacity style={s.datePicker} onPress={() => setPickerTarget('from')}>
            <Text style={s.datePickerLabel}>From</Text>
            <Text style={[s.datePickerValue, !fromDate && s.datePickerPlaceholder]}>
              {fromDate ? formatDateShort(fromDate) : 'Select'}
            </Text>
          </TouchableOpacity>
          <Text style={s.dateSep}>→</Text>
          <TouchableOpacity style={s.datePicker} onPress={() => setPickerTarget('to')}>
            <Text style={s.datePickerLabel}>To</Text>
            <Text style={[s.datePickerValue, !toDate && s.datePickerPlaceholder]}>
              {toDate ? formatDateShort(toDate) : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Type Filter */}
        <View style={s.filterRow}>
          {TYPE_FILTERS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[s.typeChip, typeFilter === key && s.typeActive]}
              onPress={() => setTypeFilter(key)}
            >
              <Text style={[s.typeText, typeFilter === key && s.typeTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator color="#a78bfa" size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No transactions found</Text>
            <Text style={s.emptySub}>
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Transactions will appear here as you log income and spending'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => item.date}
            renderItem={({ item: section }) => (
              <View style={s.dateGroup}>
                <Text style={s.dateHeader}>{section.date}</Text>
                {section.items.map(renderTransaction)}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Calendar Picker Modal */}
        <DatePickerModal
          visible={!!pickerTarget}
          value={pickerTarget === 'from' ? fromDate : toDate}
          title={pickerTarget === 'from' ? 'Select Start Date' : 'Select End Date'}
          onSelect={handleDateSelect}
          onClose={() => setPickerTarget(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '800' },
  clearBtn: { backgroundColor: '#2d2d3f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14 },
  summaryIn:  { backgroundColor: '#064e3b' },
  summaryOut: { backgroundColor: '#450a0a' },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 },
  summaryAmt: { fontSize: 20, fontWeight: '800' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  datePicker: {
    flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#2d2d3f',
  },
  datePickerLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  datePickerValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  datePickerPlaceholder: { color: '#4b5563' },
  dateSep: { color: '#4b5563', fontSize: 16 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1e1e2e',
  },
  typeActive: { backgroundColor: '#7c3aed' },
  typeText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  typeTextActive: { color: '#fff' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  emptySub: { color: '#4b5563', fontSize: 13, marginTop: 4, textAlign: 'center' },

  dateGroup: { marginBottom: 16 },
  dateHeader: { color: '#6b7280', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 12, marginBottom: 6,
  },
  txIcon: { fontSize: 20, marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  txTime: { color: '#4b5563', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
});
