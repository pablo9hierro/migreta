import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MigrationResponse, LiteralWord } from '../types';
import WordMapTable from './WordMapTable';
import LiteralTable from './LiteralTable';

const TABS = [
  { key: 'corrected', label: '✓ Correção', color: '#22C55E' },
  { key: 'wordmap',   label: '↔ Migração', color: '#3B82F6' },
  { key: 'grammar',   label: '📖 Gramática', color: '#A855F7' },
  { key: 'literal',   label: '🔤 Literal', color: '#F59E0B' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function MigrationResult({ response }: { response: MigrationResponse }) {
  const [active, setActive] = useState<TabKey>('corrected');
  const tab = TABS.find(t => t.key === active)!;

  return (
    <View style={styles.card}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, active === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
            onPress={() => setActive(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, active === t.key && { color: t.color }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={[styles.body, { borderLeftColor: tab.color }]}>
        {active === 'corrected' && (
          <Text style={styles.correctedText}>{response.corrected}</Text>
        )}

        {active === 'wordmap' && (
          <WordMapTable wordMap={response.wordMap} />
        )}

        {active === 'grammar' && (
          <Text style={styles.grammarText}>{response.explanation}</Text>
        )}

        {active === 'literal' && (
          Array.isArray(response.literalExtreme)
            ? <LiteralTable words={response.literalExtreme as LiteralWord[]} />
            : <Text style={styles.literalText}>{response.literalExtreme as string}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 10.5, color: '#8B949E', fontWeight: '700' },
  body: {
    padding: 16,
    borderLeftWidth: 3,
  },
  correctedText: { color: '#E6EDF3', fontSize: 16, lineHeight: 25 },
  grammarText: { color: '#E6EDF3', fontSize: 15, lineHeight: 23 },
  literalText: {
    color: '#F59E0B',
    fontSize: 16,
    lineHeight: 25,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  literalHint: { color: '#8B949E', fontSize: 12, lineHeight: 18 },
});
