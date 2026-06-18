import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RateLimitModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Limite da IA atingido</Text>
          <Text style={styles.body}>
            Todos os modelos gratuitos disponíveis atingiram o rate limit no momento.
            {'\n\n'}
            Isso acontece porque os modelos grátis têm cota limitada de requisições por hora.
            Aguarde alguns minutos e tente novamente.
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Os modelos são rotacionados automaticamente. A próxima tentativa vai tentar um diferente.
            </Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#F59E0B',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 14,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 20,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 13,
    marginTop: 4,
  },
  btnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
});
