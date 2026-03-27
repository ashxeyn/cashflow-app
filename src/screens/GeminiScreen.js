import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { getWeekOfMonth, toDateString } from '../utils/dateUtils';
import MarkdownText from '../components/MarkdownText';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm your Gemini financial advisor. Ask me anything about your budget, spending, or savings goals.",
};

export default function GeminiScreen() {
  const { state } = useApp();
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef(null);

  // Load saved messages on mount
  useEffect(() => {
    (async () => {
      try {
        const rows = await api.getGeminiMessages();
        if (rows.length > 0) {
          setMessages([
            WELCOME_MSG,
            ...rows.map((r) => ({ id: String(r.id), role: r.role, text: r.text })),
          ]);
        }
      } catch (e) {
        console.warn('Failed to load chat history:', e.message);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  const buildContext = () =>
    `\n\n[USER FINANCIAL CONTEXT - use this to personalize advice]:
- Today: ${toDateString(new Date())} (Week ${getWeekOfMonth(new Date())} of the month)
- Personal Savings Balance: ₱${(state.sobraBalance || 0).toFixed(2)}
- Contingency Fund Total: ₱${(state.contingencyTotal || 0).toFixed(2)}
- Monthsary Fund Total: ₱${(state.monthsaryTotal || 0).toFixed(2)}
- Credit Debt Tracked: ₱${(state.creditDebtRemaining || 0).toFixed(2)}
- Savings Goals: ${state.sobraWishlist.length > 0
      ? state.sobraWishlist.map((i) => `${i.label} (₱${i.funded}/₱${i.goal})`).join(', ')
      : 'None'}
- Weekly Fixed Income: ₱500 PHP
- Fixed Expenses: School Fund (variable), Monthsary ₱50, Contingency ₱70, 15th Buffer ₱50/wk (3 months)
- Auto savings per week: whatever's left after allocations`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!API_KEY) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: 'No Gemini API key found. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.' },
      ]);
      return;
    }

    const userText = input.trim();
    const userMsg = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message to DB
    try { await api.saveGeminiMessage('user', userText); } catch (e) { console.warn(e); }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const systemPrompt = `You are a compassionate and practical personal finance advisor for a Filipino student/young adult. 
They have a very tight weekly budget of ₱500 PHP. Be concise, empathetic, and give actionable advice in plain language. 
Use Philippine Peso (₱) for all amounts. Keep responses short and friendly.`;

      const fullPrompt = systemPrompt + buildContext() + '\n\nUser question: ' + userText;

      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText },
      ]);

      // Save assistant response to DB
      try { await api.saveGeminiMessage('assistant', responseText); } catch (e) { console.warn(e); }
    } catch (err) {
      const errText = `Error: ${err.message}`;
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: errText },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Delete all conversation history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.clearGeminiChat();
              setMessages([WELCOME_MSG]);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.role === 'user' ? (
        <Text style={[styles.bubbleText, styles.userText]}>{item.text}</Text>
      ) : (
        <MarkdownText style={styles.bubbleText}>{item.text}</MarkdownText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Ask Gemini</Text>
          {messages.length > 1 && (
            <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear Chat</Text>
            </TouchableOpacity>
          )}
        </View>
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingHistoryText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#a78bfa" size="small" />
            <Text style={styles.loadingText}>Gemini is thinking...</Text>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your budget..."
            placeholderTextColor="#4b5563"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  flex: { flex: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 8 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '800' },
  clearBtn: { backgroundColor: '#2d2d3f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  messageList: { paddingBottom: 12 },

  bubble: {
    maxWidth: '80%', borderRadius: 16, padding: 12, marginVertical: 4,
    backgroundColor: '#1e1e2e',
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#7c3aed' },
  aiBubble: { alignSelf: 'flex-start' },
  bubbleText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingHistoryText: { color: '#6b7280', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  loadingText: { color: '#6b7280', fontSize: 13 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1e1e2e',
  },
  input: {
    flex: 1, backgroundColor: '#1e1e2e', color: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#7c3aed', width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: '#2d2d3f' },
  sendText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
