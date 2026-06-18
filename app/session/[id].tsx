import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getSessions } from '../../services/storage';
import { Session } from '../../types';
import MigrationResult from '../../components/MigrationResult';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(sessions => {
        setSession(sessions.find(s => s.id === id) ?? null);
        setLoading(false);
      });
    }, [id]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Sessão não encontrada.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {session.messages.map(msg => (
          <View key={msg.id} style={styles.messageBlock}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{msg.userText}</Text>
            </View>
            <MigrationResult response={msg.response} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  center: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: { color: '#8B949E', fontSize: 16 },
  content: { padding: 16, paddingBottom: 40 },
  messageBlock: { marginBottom: 24 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '85%',
    marginBottom: 10,
  },
  userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
});
