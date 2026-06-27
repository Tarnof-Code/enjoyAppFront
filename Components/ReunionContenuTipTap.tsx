import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { colors, fonts, fontSizes, spacing } from '../config/theme';
import type { ReunionContenuTipTapJson } from '../types/api';

type TipTapNode = Record<string, unknown>;

interface ReunionContenuTipTapProps {
  contenu: ReunionContenuTipTapJson | null | undefined;
  /** Affichage compact pour la carte accueil */
  compact?: boolean;
}

function estNoeud(node: unknown): node is TipTapNode {
  return typeof node === 'object' && node !== null;
}

function appliquerMarques(marks: unknown, style: TextStyle): TextStyle {
  if (!Array.isArray(marks)) return style;
  let result = { ...style };
  for (const mark of marks) {
    if (!estNoeud(mark)) continue;
    switch (mark.type) {
      case 'bold':
        result = { ...result, fontWeight: '700' };
        break;
      case 'italic':
        result = { ...result, fontStyle: 'italic' };
        break;
      case 'strike':
        result = { ...result, textDecorationLine: 'line-through' };
        break;
      case 'code':
        result = {
          ...result,
          fontFamily: 'monospace',
          backgroundColor: colors.border,
        };
        break;
      default:
        break;
    }
  }
  return result;
}

function renderInlines(nodes: unknown, keyPrefix: string, compact: boolean): React.ReactNode[] {
  if (!Array.isArray(nodes)) return [];
  const parts: React.ReactNode[] = [];

  nodes.forEach((node, index) => {
    if (!estNoeud(node)) return;
    const key = `${keyPrefix}-inline-${index}`;

    if (node.type === 'text' && typeof node.text === 'string') {
      parts.push(
        <Text key={key} style={appliquerMarques(node.marks, compact ? styles.inlineCompact : styles.inline)}>
          {node.text}
        </Text>,
      );
      return;
    }

    if (node.type === 'hardBreak') {
      parts.push('\n');
    }
  });

  return parts;
}

function renderBlock(node: TipTapNode, key: string, compact: boolean): React.ReactNode {
  const content = node.content;
  const blocks = Array.isArray(content) ? content.filter(estNoeud) : [];

  switch (node.type) {
    case 'doc':
      return (
        <View key={key}>
          {blocks.map((child, index) => renderBlock(child, `${key}-${index}`, compact))}
        </View>
      );

    case 'paragraph':
      return (
        <Text key={key} style={compact ? styles.paragraphCompact : styles.paragraph}>
          {renderInlines(content, key, compact)}
        </Text>
      );

    case 'heading': {
      const level = estNoeud(node.attrs) && typeof node.attrs.level === 'number' ? node.attrs.level : 1;
      return (
        <Text key={key} style={headingStyle(level, compact)}>
          {renderInlines(content, key, compact)}
        </Text>
      );
    }

    case 'bulletList':
      return (
        <View key={key} style={compact ? styles.listCompact : styles.list}>
          {blocks.map((item, index) => (
            <View key={`${key}-item-${index}`} style={styles.listItemRow}>
              <Text style={compact ? styles.bulletMarkerCompact : styles.bulletMarker}>•</Text>
              <View style={styles.listItemContent}>
                {renderBlock(item, `${key}-item-${index}`, compact)}
              </View>
            </View>
          ))}
        </View>
      );

    case 'orderedList':
      return (
        <View key={key} style={compact ? styles.listCompact : styles.list}>
          {blocks.map((item, index) => (
            <View key={`${key}-item-${index}`} style={styles.listItemRow}>
              <Text style={compact ? styles.bulletMarkerCompact : styles.bulletMarker}>{index + 1}.</Text>
              <View style={styles.listItemContent}>
                {renderBlock(item, `${key}-item-${index}`, compact)}
              </View>
            </View>
          ))}
        </View>
      );

    case 'listItem':
      return (
        <View key={key}>
          {blocks.map((child, index) => renderBlock(child, `${key}-${index}`, compact))}
        </View>
      );

    case 'blockquote':
      return (
        <View key={key} style={compact ? styles.blockquoteCompact : styles.blockquote}>
          {blocks.map((child, index) => renderBlock(child, `${key}-${index}`, compact))}
        </View>
      );

    case 'codeBlock':
      return (
        <Text key={key} style={compact ? styles.codeBlockCompact : styles.codeBlock}>
          {renderInlines(content, key, compact)}
        </Text>
      );

    case 'horizontalRule':
      return <View key={key} style={compact ? styles.hrCompact : styles.hr} />;

    default:
      if (blocks.length > 0) {
        return (
          <View key={key}>
            {blocks.map((child, index) => renderBlock(child, `${key}-${index}`, compact))}
          </View>
        );
      }
      return null;
  }
}

function headingStyle(level: number, compact: boolean): StyleProp<TextStyle> {
  if (compact) {
    switch (level) {
      case 1:
        return styles.h1Compact;
      case 2:
        return styles.h2Compact;
      default:
        return styles.h3Compact;
    }
  }
  switch (level) {
    case 1:
      return styles.h1;
    case 2:
      return styles.h2;
    case 3:
      return styles.h3;
    default:
      return styles.h3;
  }
}

function ReunionContenuTipTap({ contenu, compact = false }: ReunionContenuTipTapProps) {
  if (!estNoeud(contenu) || contenu.type !== 'doc') {
    return null;
  }

  return <View style={styles.root}>{renderBlock(contenu, 'doc', compact)}</View>;
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  inline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.ink,
  },
  inlineCompact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  paragraphCompact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  h1: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  h2: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  h3: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  h1Compact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  h2Compact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 20,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  h3Compact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 18,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  list: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  listCompact: {
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bulletMarker: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: colors.ink,
    width: 22,
  },
  bulletMarkerCompact: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
    width: 18,
  },
  listItemContent: {
    flex: 1,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  blockquoteCompact: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.ink,
    backgroundColor: colors.border,
    padding: spacing.sm,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  codeBlockCompact: {
    fontFamily: 'monospace',
    fontSize: fontSizes.xs,
    lineHeight: 16,
    color: colors.ink,
    backgroundColor: colors.border,
    padding: spacing.xs,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  hr: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  hrCompact: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});

export default ReunionContenuTipTap;
