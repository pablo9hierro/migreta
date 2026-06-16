import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordMapping } from '../types';

export default function WordMapTable({ wordMap }: { wordMap: WordMapping[] }) {
  return (
    <View>
      {wordMap.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <View style={[styles.cell, item.wasNative && styles.nativeCell]}>
            <Text style={[styles.word, item.wasNative ? styles.nativeWord : styles.targetInCell]}>
              {item.original}
            </Text>
            {item.wasNative && <View style={styles.dot} />}
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.cell}>
            <Text style={[styles.word, styles.targetWord]}>{item.target}</Text>
          </View>
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.dot} />
        <Text style={styles.legendText}>escrito no idioma de origem</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 8,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6,
  },
  nativeCell: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#0D1B2A',
  },
  word: { flex: 1, fontSize: 14 },
  nativeWord: { color: '#93C5FD' },
  targetInCell: { color: '#8B949E' },
  targetWord: { color: '#E6EDF3', fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  arrow: { color: '#30363D', fontSize: 16 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  legendText: { color: '#8B949E', fontSize: 11 },
});
