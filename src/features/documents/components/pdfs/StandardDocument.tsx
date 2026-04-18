import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { BaseDocument, pdfTheme } from './PdfCommon';

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.5,
    color: pdfTheme.colors.text.main,
  },
});

interface StandardDocumentProps {
  title: string;
  visibleParagraphs: string[];
}

export const StandardDocument: React.FC<StandardDocumentProps> = ({ title, visibleParagraphs }) => (
  <BaseDocument title={title} visibleParagraphs={visibleParagraphs}>
    <View style={styles.content}>
      {visibleParagraphs.map((para, index) => (
        <Text key={index} style={styles.paragraph}>{para}</Text>
      ))}
    </View>
  </BaseDocument>
);
