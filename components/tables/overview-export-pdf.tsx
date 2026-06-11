import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export type OverviewPdfColumn = {
  header: string
  key: string
}

export type OverviewPdfRow = Record<string, string | number | boolean | null | undefined>

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 14,
  },
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 22,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headerRow: {
    backgroundColor: '#f1f5f9',
  },
  cell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  headerText: {
    fontWeight: 700,
    color: '#334155',
  },
  cellText: {
    color: '#0f172a',
  },
})

function printable(value: OverviewPdfRow[string]) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Nao'
  return String(value)
}

export function OverviewExportPDF({
  title,
  rows,
  columns,
  filters,
}: {
  title: string
  rows: OverviewPdfRow[]
  columns: OverviewPdfColumn[]
  filters?: string[]
}) {
  const visibleColumns = columns.slice(0, 8)
  const generatedAt = new Date().toLocaleString('pt-BR')
  const filterLabel = filters && filters.length > 0 ? filters.join(', ') : 'Visao geral'

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {rows.length.toLocaleString('pt-BR')} registros | Filtros: {filterLabel} | Gerado em {generatedAt}
        </Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            {visibleColumns.map((column, index) => (
              <View
                key={column.key}
                style={[styles.cell, index === visibleColumns.length - 1 ? styles.lastCell : {}]}
              >
                <Text style={styles.headerText}>{column.header}</Text>
              </View>
            ))}
          </View>
          {rows.length > 0 ? rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              wrap={false}
              style={[styles.row, rowIndex === rows.length - 1 ? styles.lastRow : {}]}
            >
              {visibleColumns.map((column, index) => (
                <View
                  key={column.key}
                  style={[styles.cell, index === visibleColumns.length - 1 ? styles.lastCell : {}]}
                >
                  <Text style={styles.cellText}>{printable(row[column.key])}</Text>
                </View>
              ))}
            </View>
          )) : (
            <View style={[styles.row, styles.lastRow]}>
              <View style={[styles.cell, styles.lastCell]}>
                <Text style={styles.cellText}>Nenhum registro encontrado para os filtros atuais.</Text>
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
