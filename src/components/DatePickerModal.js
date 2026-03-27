import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function DatePickerModal({ visible, value, onSelect, onClose, title }) {
  const initial = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear]   = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build the calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = toYMD(new Date());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedYMD = value || '';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>{title || 'Select Date'}</Text>

          {/* Month/Year Navigation */}
          <View style={s.navRow}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
              <Text style={s.navText}>◀</Text>
            </TouchableOpacity>
            <Text style={s.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
              <Text style={s.navText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={s.weekRow}>
            {DAYS.map((d) => (
              <Text key={d} style={s.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`e${idx}`} style={s.cell} />;
              }
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = ymd === selectedYMD;
              const isToday = ymd === today;

              return (
                <TouchableOpacity
                  key={day}
                  style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]}
                  onPress={() => onSelect(ymd)}
                >
                  <Text style={[s.cellText, isSelected && s.cellTextSelected, isToday && !isSelected && s.cellTextToday]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={s.actions}>
            {value && (
              <TouchableOpacity onPress={() => onSelect('')} style={s.clearBtn}>
                <Text style={s.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#1e1e2e', borderRadius: 20, padding: 20, width: 320 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8 },
  navText: { color: '#a78bfa', fontSize: 16 },
  monthLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', color: '#6b7280', fontSize: 11, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center', borderRadius: 20,
  },
  cellSelected: { backgroundColor: '#7c3aed' },
  cellToday: { borderWidth: 1, borderColor: '#a78bfa' },
  cellText: { color: '#e2e8f0', fontSize: 14 },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#a78bfa', fontWeight: '600' },

  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  clearText: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelText: { color: '#6b7280', fontSize: 14 },
});
