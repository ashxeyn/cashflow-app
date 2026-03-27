import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getLastDay(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarStrip() {
  const today = new Date();
  const [expanded, setExpanded]     = useState(false);
  const [viewYear, setViewYear]     = useState(today.getFullYear());
  const [viewMonth, setViewMonth]   = useState(today.getMonth());
  const [loggedWeeks, setLoggedWeeks] = useState({});

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const currentWeek    = Math.ceil(today.getDate() / 7);

  const fetchLogs = async () => {
    try {
      const rows = await api.getLoggedWeeks();
      const map = {};
      rows.forEach(r => { if (r.week_key) map[r.week_key] = r.type; });
      setLoggedWeeks(map);
    } catch (e) {
      console.error('Failed to fetch calendar logs', e);
    }
  };

  // Refresh every time the dashboard comes into focus
  useFocusEffect(useCallback(() => { fetchLogs(); }, []));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const lastDay    = getLastDay(viewYear, viewMonth);
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const weeksCount = Math.ceil(lastDay / 7);
  const cells      = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  const wKey = (day) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-W${Math.ceil(day / 7)}`;

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.bar} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={s.navRow}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Text style={s.arrow}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
            <Text style={s.subLabel}>
              {isCurrentMonth ? `Week ${currentWeek} of the month` : 'Past month — tap to view'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={nextMonth}
            style={[s.navBtn, isCurrentMonth && { opacity: 0.25 }]}
            hitSlop={{ top:10,bottom:10,left:10,right:10 }}
            disabled={isCurrentMonth}
          >
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Week dots */}
      <View style={s.weekRow}>
        {Array.from({ length: weeksCount }, (_, i) => i + 1).map(w => {
          const k      = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-W${w}`;
          const logged = loggedWeeks[k];
          const isCur  = isCurrentMonth && w === currentWeek;
          return (
            <View key={w} style={s.dotWrap}>
              <View style={[
                s.dot,
                isCur                  && s.dotCurrent,
                logged === 'income'    && s.dotIncome,
                logged === 'no_income' && s.dotZero,
              ]} />
              <Text style={[s.dotLabel, isCur && s.dotLabelCurrent]}>Wk {w}</Text>
            </View>
          );
        })}
      </View>

      {expanded && (
        <View style={s.grid}>
          <View style={s.row}>
            {DAYS.map(d => <Text key={d} style={s.dayHeader}>{d}</Text>)}
          </View>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, ri) => (
            <View key={ri} style={s.row}>
              {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
                const isToday  = isCurrentMonth && day === today.getDate();
                const isCurWk  = isCurrentMonth && day && Math.ceil(day / 7) === currentWeek;
                const logged   = day ? loggedWeeks[wKey(day)] : null;
                return (
                  <View key={ci} style={[s.cell, isCurWk && s.cellCurrent, isToday && s.cellToday]}>
                    <Text style={[
                      s.cellText,
                      isCurWk && s.cellTextCurrent,
                      isToday  && s.cellTextToday,
                      !day     && s.cellTextEmpty,
                    ]}>
                      {day || ''}
                    </Text>
                    {logged && (
                      <View style={[s.logDot, logged === 'no_income' ? s.logDotZero : s.logDotIncome]} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={s.legend}>
            {[['#34d399','Income logged'],['#f87171','No income'],['#7c3aed','Current week']].map(([color, label]) => (
              <View key={label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color }]} />
                <Text style={s.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#1e1e2e', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  navBtn: { padding: 4 },
  arrow: { color: '#a78bfa', fontSize: 26, fontWeight: '700', lineHeight: 28 },
  monthLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  chevron: { color: '#6b7280', fontSize: 12 },

  weekRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14 },
  dotWrap: { flex: 1, alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2d2d3f' },
  dotCurrent: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#7c3aed' },
  dotIncome: { backgroundColor: '#34d399' },
  dotZero: { backgroundColor: '#f87171' },
  dotLabel: { color: '#4b5563', fontSize: 10 },
  dotLabelCurrent: { color: '#a78bfa', fontWeight: '700' },

  grid: { paddingHorizontal: 12, paddingBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 2 },
  dayHeader: { flex: 1, textAlign: 'center', color: '#4b5563', fontSize: 11, paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6, margin: 1 },
  cellCurrent: { backgroundColor: 'rgba(124,58,237,0.2)' },
  cellToday: { borderWidth: 1.5, borderColor: '#fbbf24' },
  cellText: { color: '#9ca3af', fontSize: 13 },
  cellTextCurrent: { color: '#fff', fontWeight: '600' },
  cellTextToday: { color: '#fbbf24', fontWeight: '800' },
  cellTextEmpty: { color: 'transparent' },
  logDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  logDotIncome: { backgroundColor: '#34d399' },
  logDotZero: { backgroundColor: '#f87171' },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#6b7280', fontSize: 11 },
});
