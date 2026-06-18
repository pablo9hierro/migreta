import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordMapping } from '../types';

export default function WordMapTable({ wordMap }: { wordMap: WordMapping[] }) {
  return (
    <View>
      {/* Header */}
      <View style={styles.row}>
        <Text style={[styles.cell, styles.header]}>Input</Text>
        <Text style={styles.arrow}> </Text>
        <Text style={[styles.cell, styles.header]}>🇳🇱 Holandês</Text>
        <Text style={styles.arrow}> </Text>
        <Text style={[styles.cell, styles.header]}>🇩🇪 Alemão</Text>
      </View>
      <View style={styles.divider} />

      {wordMap.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <View style={[styles.cellWrap, item.wasNative && styles.nativeCellWrap]}>
            <Text style={[styles.cell, item.wasNative ? styles.nativeWord : styles.neutralWord]}>
              {item.original}
            </Text>
            {item.wasNative && <View style={styles.dot} />}
          </View>

          <Text style={styles.arrow}>→</Text>

          <View style={styles.cellWrap}>
            <Text style={[styles.cell, styles.targetWord]}>{item.target}</Text>
          </View>

          <Text style={styles.arrow}>→</Text>

          <View style={styles.cellWrap}>
            <Text style={[styles.cell, styles.deWord]}>{item.de}</Text>
          </View>
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.dot} />
        <Text style={styles.legendText}>escrito em português</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#21262D',
    marginBottom: 8,
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 5,
  },
  nativeCellWrap: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#0D1B2A',
  },
  cell: { flex: 1, fontSize: 13 },
  header: { color: '#8B949E', fontWeight: '700', fontSize: 11 },
  neutralWord: { color: '#8B949E' },
  nativeWord: { color: '#93C5FD' },
  targetWord: { color: '#E6EDF3', fontWeight: '600' },
  deWord: { color: '#FCD34D', fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  arrow: { color: '#30363D', fontSize: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  legendText: { color: '#8B949E', fontSize: 11 },
});
