import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { LANGUAGES } from '../constants/languages';

interface PickerProps {
  value: string;
  onChange: (code: string) => void;
  exclude: string;
}

function LangPicker({ value, onChange, exclude }: PickerProps) {
  const [open, setOpen] = useState(false);
  const lang = LANGUAGES.find(l => l.code === value);

  return (
    <>
      <TouchableOpacity style={styles.picker} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.flag}>{lang?.flag}</Text>
        <Text style={styles.langName}>{lang?.name}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={LANGUAGES.filter(l => l.code !== exclude)}
              keyExtractor={l => l.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.code === value && styles.optionActive]}
                  onPress={() => { onChange(item.code); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <Text style={[styles.optionName, item.code === value && styles.optionNameActive]}>
                    {item.name}
                  </Text>
                  {item.code === value && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface Props {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (code: string) => void;
  onTargetChange: (code: string) => void;
  onSwap: () => void;
}

export default function LanguageSelector({
  sourceLang, targetLang, onSourceChange, onTargetChange, onSwap,
}: Props) {
  return (
    <View style={styles.row}>
      <LangPicker value={sourceLang} onChange={onSourceChange} exclude={targetLang} />
      <TouchableOpacity style={styles.swapBtn} onPress={onSwap} activeOpacity={0.7}>
        <Text style={styles.swapIcon}>⇄</Text>
      </TouchableOpacity>
      <LangPicker value={targetLang} onChange={onTargetChange} exclude={sourceLang} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  picker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 8,
  },
  flag: { fontSize: 20 },
  langName: { flex: 1, color: '#E6EDF3', fontSize: 14, fontWeight: '600' },
  chevron: { color: '#8B949E', fontSize: 14 },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: { color: '#7C3AED', fontSize: 18 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    maxHeight: 420,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  optionActive: { backgroundColor: '#1C2128' },
  optionFlag: { fontSize: 22 },
  optionName: { flex: 1, fontSize: 15, color: '#8B949E' },
  optionNameActive: { color: '#E6EDF3', fontWeight: '600' },
  check: { color: '#7C3AED', fontSize: 16 },
});
