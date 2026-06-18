import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LiteralWord } from '../types';

const ROWS = [
  { key: 'pt' as const, flag: '🇧🇷', color: '#93C5FD' },
  { key: 'nl' as const, flag: '🇳🇱', color: '#E6EDF3' },
  { key: 'de' as const, flag: '🇩🇪', color: '#FCD34D' },
];

interface Props {
  words: LiteralWord[];
  examples: string[];
}

export default function LiteralTable({ words, examples }: Props) {
  return (
    <View>
      {/* Word-by-word rows — no boxes, plain aligned text */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {ROWS.map(row => (
            <View key={row.key} style={styles.row}>
              <Text style={styles.flag}>{row.flag}</Text>
              {words.map((w, i) => (
                <Text key={i} style={[styles.word, { color: row.color }]}>
                  {w[row.key]}{i < words.length - 1 ? '  ' : ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 6 example sentences */}
      {examples.length > 0 && (
        <>
          <View style={styles.separator} />
          {examples.map((ex, i) => (
            <Text key={i} style={styles.example}>{ex}</Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  flag: { fontSize: 15, marginRight: 8, width: 24 },
  word: { fontSize: 14, fontWeight: '500' },
  separator: {
    height: 1,
    backgroundColor: '#30363D',
    marginTop: 12,
    marginBottom: 14,
  },
  example: {
    color: '#E6EDF3',
    fontSize: 14,
    lineHeight: 26,
    paddingVertical: 2,
  },
});
