import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MigrationResponse, GrammarExample, LiteralWord } from '../types';
import WordMapTable from './WordMapTable';
import LiteralTable from './LiteralTable';

const TABS = [
  { key: 'corrected', label: '✓ Correção',  color: '#22C55E' },
  { key: 'wordmap',   label: '↔ Migração',  color: '#3B82F6' },
  { key: 'grammar',   label: '📖 Gramática', color: '#A855F7' },
  { key: 'literal',   label: '🔤 Literal',  color: '#F59E0B' },
] as const;

type TabKey = typeof TABS[number]['key'];

function GrammarDisplay({ items }: { items: GrammarExample[] }) {
  return (
    <View style={gram.container}>
      {items.map((item, i) => (
        <View key={i} style={gram.block}>
          {/* Dutch sentence */}
          <Text style={gram.nlText}>{item.nl}</Text>

          {/* PT translation — yellow, bordered */}
          <View style={gram.transBorder}>
            <Text style={gram.transText}>🇧🇷 {item.pt}</Text>
          </View>

          {/* DE translation — yellow, bordered */}
          <View style={gram.transBorder}>
            <Text style={gram.transText}>🇩🇪 {item.de}</Text>
          </View>

          {/* Note */}
          <Text style={gram.note}>↳ {item.note}</Text>
        </View>
      ))}
    </View>
  );
}

export default function MigrationResult({ response }: { response: MigrationResponse }) {
  const [active, setActive] = useState<TabKey>('corrected');
  const tab = TABS.find(t => t.key === active)!;

  const grammarItems = Array.isArray(response.explanation)
    ? response.explanation as GrammarExample[]
    : null;

  const literalWords = Array.isArray(response.literalExtreme)
    ? response.literalExtreme as LiteralWord[]
    : null;

  return (
    <View style={styles.card}>
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

      <View style={[styles.body, { borderLeftColor: tab.color }]}>
        {active === 'corrected' && (
          <Text style={styles.correctedText}>{response.corrected}</Text>
        )}

        {active === 'wordmap' && (
          <WordMapTable wordMap={response.wordMap} />
        )}

        {active === 'grammar' && (
          grammarItems
            ? <GrammarDisplay items={grammarItems} />
            : <Text style={styles.legacyText}>{response.explanation as string}</Text>
        )}

        {active === 'literal' && (
          literalWords
            ? <LiteralTable words={literalWords} examples={response.literalExamples ?? []} />
            : <Text style={styles.legacyText}>{response.literalExtreme as string}</Text>
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#21262D' },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 10.5, color: '#8B949E', fontWeight: '700' },
  body: { padding: 16, borderLeftWidth: 3 },
  correctedText: { color: '#E6EDF3', fontSize: 16, lineHeight: 25 },
  legacyText: { color: '#E6EDF3', fontSize: 15, lineHeight: 23 },
});

const gram = StyleSheet.create({
  container: { gap: 20 },
  block: { gap: 6 },
  nlText: { color: '#E6EDF3', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  transBorder: {
    borderLeftWidth: 2,
    borderLeftColor: '#F59E0B',
    paddingLeft: 10,
    paddingVertical: 3,
  },
  transText: { color: '#FCD34D', fontSize: 14, lineHeight: 20 },
  note: { color: '#8B949E', fontSize: 13, lineHeight: 20, marginTop: 2 },
});
