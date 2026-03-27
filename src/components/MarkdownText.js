import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';

/**
 * Lightweight markdown renderer for chat bubbles.
 * Supports: **bold**, *italic*, `code`, bullet lists (- or •)
 */
export default function MarkdownText({ children, style }) {
  if (typeof children !== 'string') return <Text style={style}>{children}</Text>;

  const lines = children.split('\n');

  return (
    <View>
      {lines.map((line, li) => {
        const trimmed = line.trim();

        // Bullet point
        const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
        if (bulletMatch && !trimmed.match(/^\*\*.+\*\*$/)) {
          return (
            <View key={li} style={s.bulletRow}>
              <Text style={[style, s.bullet]}>•</Text>
              <Text style={[style, s.bulletText]}>{parseInline(bulletMatch[1], style)}</Text>
            </View>
          );
        }

        // Heading-like lines (### or ##)
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
        if (headingMatch) {
          return (
            <Text key={li} style={[style, s.heading]}>
              {parseInline(headingMatch[1], style)}
              {li < lines.length - 1 ? '\n' : ''}
            </Text>
          );
        }

        // Normal line
        return (
          <Text key={li} style={style}>
            {parseInline(line, style)}
            {li < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </View>
  );
}

function parseInline(text, baseStyle) {
  // Split by bold (**...**), italic (*...*), and code (`...`)
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<Text key={match.index} style={s.bold}>{match[2]}</Text>);
    } else if (match[3]) {
      // *italic*
      parts.push(<Text key={match.index} style={s.italic}>{match[3]}</Text>);
    } else if (match[4]) {
      // `code`
      parts.push(<Text key={match.index} style={s.code}>{match[4]}</Text>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length === 0 ? text : parts;
}

const s = StyleSheet.create({
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    paddingHorizontal: 4,
    fontSize: 13,
  },
  heading: { fontWeight: '700', fontSize: 15, marginBottom: 2 },
  bulletRow: { flexDirection: 'row', paddingLeft: 4, marginVertical: 1 },
  bullet: { marginRight: 6, lineHeight: 20 },
  bulletText: { flex: 1, lineHeight: 20 },
});
