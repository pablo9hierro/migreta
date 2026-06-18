import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LiteralWord } from '../types';

const ROWS = [
  { key: 'nl' as const, flag: '🇳🇱', color: '#E6EDF3' },
  { key: 'pt' as const, flag: '🇧🇷', color: '#93C5FD' },
  { key: 'de' as const, flag: '🇩🇪', color: '#FCD34D' },
];

export default function LiteralTable({ words }: { words: LiteralWord[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {ROWS.map(row => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.flag}>{row.flag}</Text>
            {words.map((w, i) => (
              <View key={i} style={styles.cell}>
                <Text style={[styles.word, { color: row.color }]}>{w[row.key]}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: { paddingBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  flag: {
    fontSize: 16,
    width: 28,
    marginRight: 4,
  },
  cell: {
    minWidth: 52,
    paddingHorizontal: 6,
    paddingVertical: 5,
    marginRight: 4,
    backgroundColor: '#21262D',
    borderRadius: 6,
    alignItems: 'center',
  },
  word: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
