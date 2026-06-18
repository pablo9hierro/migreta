import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { getSessions, deleteSession } from '../services/storage';
import { Session } from '../types';
import { getLang } from '../constants/languages';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, []),
  );

  function confirmDelete(id: string) {
    Alert.alert('Apagar sessão?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          setSessions(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Nenhuma sessão salva ainda</Text>
          </View>
        }
        renderItem={({ item }) => <SessionCard session={item} onDelete={() => confirmDelete(item.id)} />}
      />
    </SafeAreaView>
  );
}

function SessionCard({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const src = getLang(session.sourceLang);
  const tgt = getLang(session.targetLang);
  const date = new Date(session.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const preview = session.messages[0]?.userText ?? 'Sem mensagens';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.pair}>
          {src.flag} {src.name} → {tgt.flag} {tgt.name}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.count}>{session.messages.length} migração(ões)</Text>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7} hitSlop={12}>
          <Text style={styles.deleteBtn}>Apagar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pair: { color: '#E6EDF3', fontSize: 14, fontWeight: '700' },
  date: { color: '#8B949E', fontSize: 12 },
  preview: { color: '#8B949E', fontSize: 14, lineHeight: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { color: '#7C3AED', fontSize: 12, fontWeight: '600' },
  deleteBtn: { color: '#EF4444', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#8B949E', fontSize: 16 },
});
