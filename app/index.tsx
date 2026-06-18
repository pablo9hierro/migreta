import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MigrationResult from '../components/MigrationResult';
import RateLimitModal from '../components/RateLimitModal';
import { migrateText, RateLimitError } from '../services/ai';
import { upsertSession, newSession, newMessage } from '../services/storage';
import { Session, Message } from '../types';

const SOURCE_LANG = 'Português Brasileiro';
const TARGET_LANG = 'Nederlands (Holandês)';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitVisible, setRateLimitVisible] = useState(false);
  const [session, setSession] = useState<Session>(() => newSession('pt', 'nl'));
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const response = await migrateText(SOURCE_LANG, TARGET_LANG, text);
      const msg = newMessage(text, response);
      const updatedMessages = [...messages, msg];
      setMessages(updatedMessages);

      const updatedSession: Session = { ...session, messages: updatedMessages };
      setSession(updatedSession);
      await upsertSession(updatedSession);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } catch (e) {
      if (e instanceof RateLimitError) {
        setRateLimitVisible(true);
      } else {
        setError(e instanceof Error ? e.message : 'Erro ao conectar com a IA');
      }
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, session]);

  const handleNewSession = () => {
    setMessages([]);
    setSession(newSession('pt', 'nl'));
    setError(null);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RateLimitModal visible={rateLimitVisible} onClose={() => setRateLimitVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>migreta</Text>
          <View style={styles.langBadgeRow}>
            <Text style={styles.langBadge}>🇧🇷 PT</Text>
            <Text style={styles.langArrow}>→</Text>
            <Text style={styles.langBadge}>🇳🇱 NL</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleNewSession} activeOpacity={0.7}>
              <Text style={styles.iconBtnText}>+</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/history')} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyBrain}>🧠</Text>
            <Text style={styles.emptyTitle}>Comece a migrar</Text>
            <Text style={styles.emptyDesc}>
              Escreva em holandês e use português quando não souber uma palavra.
              O professor corrige, mapeia e explica a estrutura.
            </Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>Exemplo</Text>
              <Text style={styles.exampleText}>
                "Ik wil{' '}
                <Text style={styles.exampleNative}>comer</Text>
                {' '}een broodje, maar het is te{' '}
                <Text style={styles.exampleNative}>quente</Text>."
              </Text>
              <Text style={styles.exampleHint}>↑ mistura holandês + português</Text>
            </View>
          </View>
        ) : (
          messages.map(msg => (
            <View key={msg.id} style={styles.messageBlock}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.userText}</Text>
              </View>
              <MigrationResult response={msg.response} />
            </View>
          ))
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#7C3AED" size="small" />
            <Text style={styles.loadingText}>Migrando...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escreva em holandês (pode misturar com português)..."
              placeholderTextColor="#8B949E"
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnOff]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  logo: { fontSize: 26, fontWeight: '800', color: '#E6EDF3', letterSpacing: -0.5, marginBottom: 4 },
  langBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langBadge: { fontSize: 12, color: '#E6EDF3', backgroundColor: '#21262D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '700' },
  langArrow: { fontSize: 12, color: '#7C3AED', fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#161B22', borderWidth: 1, borderColor: '#30363D',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { color: '#8B949E', fontSize: 18, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyBrain: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#8B949E', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  exampleBox: {
    width: '100%', backgroundColor: '#161B22', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#30363D', gap: 6,
  },
  exampleLabel: { fontSize: 11, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 },
  exampleText: { fontSize: 14, color: '#E6EDF3', lineHeight: 21 },
  exampleNative: { color: '#93C5FD' },
  exampleHint: { fontSize: 12, color: '#8B949E' },
  messageBlock: { marginBottom: 24 },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#7C3AED',
    borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    maxWidth: '85%', marginBottom: 10,
  },
  userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: '#8B949E', fontSize: 14 },
  errorBox: {
    backgroundColor: '#1C1010', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#EF4444', marginTop: 8,
  },
  errorText: { color: '#FCA5A5', fontSize: 14 },
  inputSafe: { backgroundColor: '#0D1117' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#21262D', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: '#161B22', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, color: '#E6EDF3',
    fontSize: 15, borderWidth: 1, borderColor: '#30363D',
    minHeight: 48, maxHeight: 130,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#2D1B69', opacity: 0.45 },
  sendIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
