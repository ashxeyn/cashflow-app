import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import WithdrawGoalModal from '../components/WithdrawGoalModal';
import AddGoalModal from '../components/AddGoalModal';

export default function SobraScreen() {
  const { state, actions } = useApp();
  const [fundAmounts, setFundAmounts]   = useState({});
  const [editingId, setEditingId]       = useState(null);
  const [editLabel, setEditLabel]       = useState('');
  const [editGoal, setEditGoal]         = useState('');
  const [withdrawGoal, setWithdrawGoal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalGoals  = state.sobraWishlist.reduce((sum, i) => sum + (i.goal || 0), 0);
  const totalFunded = state.sobraWishlist.reduce((sum, i) => sum + (i.funded || 0), 0);

  const handleAdd = (lbl, g) => {
    actions.addSavingsGoal(lbl, g);
    setShowAddModal(false);
  };

  const handleFund = async (id) => {
    const amount = parseFloat(fundAmounts[id] || '0');
    if (isNaN(amount) || amount <= 0) return;
    try {
      await actions.fundSavingsGoal(id, amount);
      setFundAmounts((prev) => ({ ...prev, [id]: '' }));
    } catch {
      Alert.alert('Insufficient Savings', `You only have ₱${(state.sobraBalance || 0).toFixed(2)} in savings.`);
    }
  };

  const handleWithdraw = async (id) => {
    const amount = parseFloat(fundAmounts[id] || '0');
    if (isNaN(amount) || amount <= 0) return;
    try {
      await actions.withdrawFromGoal(id, amount);
      setFundAmounts((prev) => ({ ...prev, [id]: '' }));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReturn = async (id) => {
    const amount = parseFloat(fundAmounts[id] || '0');
    if (isNaN(amount) || amount <= 0) return;
    try {
      await actions.returnFromGoal(id, amount);
      setFundAmounts((prev) => ({ ...prev, [id]: '' }));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditGoal(String(item.goal));
  };

  const handleSaveEdit = async (id) => {
    const g = parseFloat(editGoal);
    if (!editLabel.trim() || isNaN(g) || g <= 0) {
      Alert.alert('Invalid', 'Enter a valid name and amount.');
      return;
    }
    await actions.editSavingsGoal(id, editLabel.trim(), g);
    setEditingId(null);
  };

  const renderItem = ({ item }) => {
    const progress  = item.goal > 0 ? item.funded / item.goal : 0;
    const isFunded  = item.funded >= item.goal;
    const isEditing = editingId === item.id;

    return (
      <View style={[styles.itemCard, isFunded && styles.itemFunded]}>
        {isEditing ? (
          // Edit mode
          <View>
            <Text style={styles.editTitle}>Edit Goal</Text>
            <TextInput
              style={styles.editInput}
              value={editLabel}
              onChangeText={setEditLabel}
              placeholder="Goal name"
              placeholderTextColor="#4b5563"
            />
            <TextInput
              style={styles.editInput}
              value={editGoal}
              onChangeText={setEditGoal}
              placeholder="Target amount ₱"
              placeholderTextColor="#4b5563"
              keyboardType="numeric"
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveEditBtn} onPress={() => handleSaveEdit(item.id)}>
                <Text style={styles.saveEditBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingId(null)}>
                <Text style={styles.cancelEditBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View mode
          <>
            <View style={styles.itemHeader}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <View style={styles.itemActions}>
                {isFunded
                  ? <Text style={styles.badge}>Fully Saved ✓</Text>
                  : <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
                }
                <TouchableOpacity onPress={() => startEdit(item)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    const msg = `Delete "${item.label}"? This will return ₱${(item.funded || 0).toFixed(2)} to your savings balance.`;
                    if (Platform.OS === 'web') {
                      if (window.confirm(msg)) {
                        actions.removeSavingsGoal(item.id);
                      }
                    } else {
                      Alert.alert('Delete Goal', msg, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => actions.removeSavingsGoal(item.id) },
                      ]);
                    }
                  }}
                >
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              ₱{(item.funded || 0).toFixed(2)} saved of ₱{(item.goal || 0).toFixed(2)} goal
            </Text>
            {!isFunded && (
              <View style={styles.fundRow}>
                <TextInput
                  style={styles.fundInput}
                  placeholder="Add to goal"
                  placeholderTextColor="#4b5563"
                  keyboardType="numeric"
                  value={fundAmounts[item.id] || ''}
                  onChangeText={(v) => setFundAmounts((prev) => ({ ...prev, [item.id]: v }))}
                />
                <TouchableOpacity style={styles.fundBtn} onPress={() => handleFund(item.id)}>
                  <Text style={styles.fundBtnText}>+ Save</Text>
                </TouchableOpacity>
                {item.funded > 0 && (
                  <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawGoal(item)}>
                    <Text style={styles.withdrawBtnText}>Withdraw</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {isFunded && (
              <TouchableOpacity style={styles.withdrawBtnFull} onPress={() => setWithdrawGoal(item)}>
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>My Savings</Text>
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.headerAddBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerLabel}>Available Savings</Text>
            <Text style={styles.bannerAmount}>₱{(state.sobraBalance || 0).toFixed(2)}</Text>
          </View>
          {state.sobraWishlist.length > 0 && (
            <View style={styles.bannerRight}>
              <Text style={styles.bannerLabel}>Goals Progress</Text>
              <Text style={styles.bannerSub}>
                ₱{(totalFunded || 0).toFixed(0)} / ₱{(totalGoals || 0).toFixed(0)}
              </Text>
            </View>
          )}
        </View>

        <FlatList
          data={state.sobraWishlist}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🐷</Text>
              <Text style={styles.empty}>No savings goals yet.</Text>
              <Text style={styles.emptySub}>Add something you're saving up for above.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />

        <WithdrawGoalModal
          visible={!!withdrawGoal}
          goal={withdrawGoal}
          onUsed={async (amt) => {
            try { await actions.withdrawFromGoal(withdrawGoal.id, amt); setWithdrawGoal(null); }
            catch (e) { Alert.alert('Error', e.message); }
          }}
          onReturn={async (amt) => {
            try { await actions.returnFromGoal(withdrawGoal.id, amt); setWithdrawGoal(null); }
            catch (e) { Alert.alert('Error', e.message); }
          }}
          onClose={() => setWithdrawGoal(null)}
        />

        <AddGoalModal
          visible={showAddModal}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerAddBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  headerAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  banner: {
    backgroundColor: '#064e3b', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  bannerLabel: { color: '#6ee7b7', fontSize: 12, marginBottom: 2 },
  bannerAmount: { color: '#34d399', fontSize: 26, fontWeight: '800' },
  bannerRight: { alignItems: 'flex-end' },
  bannerSub: { color: '#34d399', fontSize: 15, fontWeight: '700' },

  itemCard: { backgroundColor: '#1e1e2e', borderRadius: 14, padding: 14, marginBottom: 10 },
  itemFunded: { borderWidth: 1, borderColor: '#34d399' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: '600', flex: 1 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  pct: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 14 },
  deleteBtnText: { fontSize: 14 },
  progressBg: { height: 6, backgroundColor: '#2d2d3f', borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: '#7c3aed', borderRadius: 3 },
  progressText: { color: '#6b7280', fontSize: 12, marginBottom: 8 },
  fundRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  fundInput: {
    flex: 1, backgroundColor: '#2d2d3f', color: '#fff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7, fontSize: 14,
  },
  fundBtn: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  fundBtnText: { color: '#fff', fontWeight: '600' },
  withdrawBtn: { backgroundColor: '#2d2d3f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#7c3aed' },
  withdrawBtnFull: { backgroundColor: '#2d2d3f', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: '#7c3aed' },
  withdrawBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 13 },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  removeBtnText: { color: '#f87171', fontWeight: '600' },

  editTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  editInput: {
    backgroundColor: '#2d2d3f', color: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 8,
  },
  editActions: { flexDirection: 'row', gap: 8 },
  saveEditBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  saveEditBtnText: { color: '#fff', fontWeight: '700' },
  cancelEditBtn: { flex: 1, backgroundColor: '#2d2d3f', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelEditBtnText: { color: '#9ca3af', fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  empty: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  emptySub: { color: '#4b5563', fontSize: 13, marginTop: 4 },
});
