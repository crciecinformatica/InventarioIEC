"use client";

import {
 Document,
 Page,
 Text,
 View,
 StyleSheet,
 Font,
} from "@react-pdf/renderer";

// Registrar fonte padrão para suporte a caracteres PT-BR
Font.register({
 family: "Inter",
 fonts: [
  { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
  { src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 },
  { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
 ],
});

const c = {
 blue: "#3b82f6",
 violet: "#8b5cf6",
 cyan: "#06b6d4",
 emerald: "#10b981",
 amber: "#f59e0b",
 red: "#ef4444",
 slate50: "#f8fafc",
 slate100: "#f1f5f9",
 slate200: "#e2e8f0",
 slate400: "#94a3b8",
 slate500: "#64748b",
 slate700: "#334155",
 slate900: "#0f172a",
 green100: "#dcfce7",
 green700: "#15803d",
 white: "#ffffff",
};

const s = StyleSheet.create({
 page: {
  fontFamily: "Inter",
  backgroundColor: c.white,
  paddingTop: 32,
  paddingHorizontal: 32,
  paddingBottom: 60,
  fontSize: 9,
 },
 // Cabeçalho
 header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: c.slate200,
 },
 headerLeft: { flex: 1 },
 headerTitle: { fontSize: 20, fontWeight: 700, color: c.slate900 },
 headerSub: { fontSize: 9, color: c.slate400, marginTop: 2 },
 headerBadge: {
  backgroundColor: c.slate100,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
 },
 headerBadgeText: { fontSize: 8, color: c.slate500, fontWeight: 600 },
 // Seção
 section: { marginBottom: 20 },
 sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
 sectionDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
 sectionTitle: { fontSize: 13, fontWeight: 700, color: c.slate900 },
 sectionSub: { fontSize: 8, color: c.slate400, marginLeft: "auto" },
 // Cards de métricas
 metricsRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
 metricCard: {
  flex: 1,
  backgroundColor: c.slate50,
  borderWidth: 1,
  borderColor: c.slate100,
  borderRadius: 8,
  padding: 8,
 },
 metricLabel: {
  fontSize: 7,
  color: c.slate400,
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: 3,
 },
 metricValue: { fontSize: 16, fontWeight: 700, color: c.slate900 },
 metricValueGreen: { fontSize: 16, fontWeight: 700, color: c.emerald },
 metricValueAmber: { fontSize: 16, fontWeight: 700, color: c.amber },
 metricValueRed: { fontSize: 16, fontWeight: 700, color: c.red },
 // Tabela
 table: {
  borderWidth: 1,
  borderColor: c.slate100,
  borderRadius: 8,
  overflow: "hidden",
  marginTop: 6,
 },
 tableHeader: {
  flexDirection: "row",
  backgroundColor: c.slate50,
  paddingVertical: 5,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: c.slate100,
 },
 tableHeaderCell: {
  fontSize: 7,
  fontWeight: 700,
  color: c.slate400,
  textTransform: "uppercase",
 },
 tableRow: {
  flexDirection: "row",
  paddingVertical: 5,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: c.slate50,
 },
 tableRowAlt: {
  flexDirection: "row",
  paddingVertical: 5,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: c.slate50,
  backgroundColor: "#fafafa",
 },
 tableCell: { fontSize: 8, color: c.slate700 },
 tableCellGreen: { fontSize: 8, color: c.green700, fontWeight: 600 },
 tableCellGray: { fontSize: 8, color: c.slate400 },
 // Badge alocado
 badgeGreen: {
  backgroundColor: c.green100,
  paddingHorizontal: 5,
  paddingVertical: 1,
  borderRadius: 4,
 },
 badgeGreenText: { fontSize: 7, color: c.green700, fontWeight: 600 },
 // Setores
 setoresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
 setorCard: {
  backgroundColor: c.slate50,
  borderWidth: 1,
  borderColor: c.slate100,
  borderRadius: 6,
  padding: 6,
  width: "31%",
 },
 setorName: {
  fontSize: 7,
  fontWeight: 600,
  color: c.slate700,
  marginBottom: 2,
 },
 setorMeta: { fontSize: 7, color: c.slate400 },
 progressBarBg: {
  backgroundColor: c.slate200,
  borderRadius: 4,
  height: 4,
  marginTop: 3,
 },
 // Footer
 footer: {
  position: "absolute",
  bottom: 20,
  left: 32,
  right: 32,
  flexDirection: "row",
  justifyContent: "space-between",
  borderTopWidth: 1,
  borderTopColor: c.slate100,
  paddingTop: 8,
 },
 footerText: { fontSize: 7, color: c.slate400 },
 pageNumber: { fontSize: 7, color: c.slate400 },
});

function pct(v: number, t: number) {
 return t > 0 ? Math.round((v / t) * 100) : 0;
}
const CHART_COLORS = [c.blue, c.violet, c.cyan, c.emerald, c.amber, c.red];

function buildSetores(items: any[]) {
 const map = new Map<string, { total: number; alocados: number }>();
 for (const item of items) {
  const setor =
   item.setor_nome ||
   item.alocacao_ativa?.setor ||
   "Sem setor";
  const cur = map.get(setor) ?? { total: 0, alocados: 0 };
  cur.total++;
  if ((item.alocacoes_ativas?.length ?? 0) > 0 || item.alocacao_ativa)
   cur.alocados++;
  map.set(setor, cur);
 }
 return Array.from(map.entries())
  .map(([setor, v], i) => ({
   setor,
   ...v,
   color: CHART_COLORS[i % CHART_COLORS.length],
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 9);
}

function formatDatePdf(d: string | null | undefined) {
 if (!d) return "—";
 return new Date(d).toLocaleDateString("pt-BR");
}

// ──── Seção genérica ────────────────────────────────────────────────────────

interface SectionProps {
 title: string;
 color: string;
 items: any[];
 total: number;
 geradoEm: string;
 getIdentifier: (item: any) => string;
 getModelo: (item: any) => string;
 getSetor: (item: any) => string;
 getExtra?: (item: any) => string;
}

function Section({
 title,
 color,
 items,
 total,
 getIdentifier,
 getModelo,
 getSetor,
 getExtra,
}: SectionProps) {
 const alocados = items.filter(
  (i) => (i.alocacoes_ativas?.length ?? 0) > 0 || i.alocacao_ativa,
 ).length;
 const livres = Math.max(0, items.length - alocados);
 const ocupacao = pct(alocados, items.length);
 const setores = buildSetores(items);

 const metricValueStyle =
  ocupacao >= 90
   ? s.metricValueRed
   : ocupacao >= 50
     ? s.metricValueAmber
     : s.metricValueGreen;

 return (
  <View style={s.section} wrap={false}>
   {/* Cabeçalho da seção */}
   <View style={s.sectionHeader}>
    <View style={[s.sectionDot, { backgroundColor: color }]} />
    <Text style={s.sectionTitle}>{title}</Text>
    <Text style={s.sectionSub}>
     {total.toLocaleString("pt-BR")} cadastrados no total
    </Text>
   </View>

   {/* Métricas */}
   <View style={s.metricsRow}>
    <View style={s.metricCard}>
     <Text style={s.metricLabel}>Analisados</Text>
     <Text style={s.metricValue}>{items.length.toLocaleString("pt-BR")}</Text>
    </View>
    <View style={s.metricCard}>
     <Text style={s.metricLabel}>Alocados</Text>
     <Text style={s.metricValue}>{alocados.toLocaleString("pt-BR")}</Text>
    </View>
    <View style={s.metricCard}>
     <Text style={s.metricLabel}>Livres</Text>
     <Text style={s.metricValueGreen}>{livres.toLocaleString("pt-BR")}</Text>
    </View>
    <View style={s.metricCard}>
     <Text style={s.metricLabel}>Ocupação</Text>
     <Text style={metricValueStyle}>{ocupacao}%</Text>
    </View>
   </View>

   {/* Setores */}
   {setores.length > 0 && (
    <View>
     <Text style={[s.tableHeaderCell, { marginBottom: 4 }]}>
      Distribuição por setor
     </Text>
     <View style={s.setoresGrid}>
      {setores.map((st) => (
       <View key={st.setor} style={s.setorCard}>
        <View
         style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          marginBottom: 2,
         }}
        >
         <View
          style={{
           width: 6,
           height: 6,
           borderRadius: 3,
           backgroundColor: st.color,
          }}
         />
         <Text style={s.setorName}>{st.setor}</Text>
        </View>
        <Text style={s.setorMeta}>
         {st.alocados}/{st.total} alocados · {pct(st.total, items.length)}% do
         total
        </Text>
        {/* Progress bar simulado com View */}
        <View style={s.progressBarBg}>
         <View
          style={{
           width: `${pct(st.alocados, st.total)}%` as any,
           backgroundColor: st.color,
           height: 4,
           borderRadius: 4,
          }}
         />
        </View>
       </View>
      ))}
     </View>
    </View>
   )}

   {/* Tabela de itens
      <View style={[s.table, { marginTop: 10 }]}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Identificador</Text>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Modelo</Text>
          <Text style={[s.tableHeaderCell, { flex: 2 }]}>Setor</Text>
          {getExtra && <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Info</Text>}
          <Text style={[s.tableHeaderCell, { flex: 3 }]}>Alocado a</Text>
          <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Desde</Text>
        </View>
        {items.slice(0, 80).map((item, idx) => {
          const alocacoes = item.alocacoes_ativas ?? (item.alocacao_ativa ? [item.alocacao_ativa] : [])
          const primeiroColab = alocacoes[0]?.colaborador?.nome ?? null
          const dataInicio = alocacoes[0]?.data_inicio ?? null
          const rowStyle = idx % 2 === 0 ? s.tableRow : s.tableRowAlt
          return (
            <View key={item.id} style={rowStyle}>
              <Text style={[s.tableCell, { flex: 2 }]}>{getIdentifier(item)}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{getModelo(item)}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{getSetor(item)}</Text>
              {getExtra && <Text style={[s.tableCell, { flex: 1.5 }]}>{getExtra(item)}</Text>}
              {primeiroColab ? (
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.tableCellGreen}>{primeiroColab}</Text>
                  {alocacoes.length > 1 && (
                    <View style={s.badgeGreen}>
                      <Text style={s.badgeGreenText}>+{alocacoes.length - 1}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[s.tableCellGray, { flex: 3 }]}>Livre</Text>
              )}
              <Text style={[s.tableCell, { flex: 1.5 }]}>{formatDatePdf(dataInicio)}</Text>
            </View>
          )
        })}
        {items.length > 80 && (
          <View style={[s.tableRow, { backgroundColor: c.slate50 }]}>
            <Text style={[s.tableCellGray, { flex: 1 }]}>
              + {items.length - 80} itens omitidos — veja a listagem completa no sistema.
            </Text>
          </View>
        )}
      </View> */}
  </View>
 );
}

// ──── Documento principal ────────────────────────────────────────────────────

interface Props {
 data: {
  maquinas: any[];
  notebooks: any[];
  aparelhos: any[];
  ramais: any[];
  gerado_em: string;
 };
}

export function DashboardPDF({ data }: Props) {
 const { maquinas, notebooks, aparelhos, ramais, gerado_em } = data;
 const totalGeral =
  maquinas.length + notebooks.length + aparelhos.length + ramais.length;
 const totalAlocados = [
  ...maquinas,
  ...notebooks,
  ...aparelhos,
  ...ramais,
 ].filter(
  (i) => (i.alocacoes_ativas?.length ?? 0) > 0 || i.alocacao_ativa,
 ).length;
 const dataFormatada = new Date(gerado_em).toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });

 return (
  <Document
   title="Dashboard IEC — Inventário de TI"
   author="IEC Inventário"
   creator="IEC Inventário"
  >
   {/* ── Capa ── */}
   <Page size="A4" style={s.page}>
    <View style={s.header}>
     <View style={s.headerLeft}>
      <Text style={s.headerTitle}>IEC Inventário</Text>
      <Text
       style={[s.headerSub, { fontSize: 11, color: c.slate700, marginTop: 3 }]}
      >
       Relatório Geral de Inventário de TI
      </Text>
      <Text style={s.headerSub}>Gerado em {dataFormatada}</Text>
     </View>
    </View>

    {/* Resumo executivo */}
    <View style={{ marginBottom: 20 }}>
     <Text style={[s.tableHeaderCell, { marginBottom: 8, fontSize: 8 }]}>
      Resumo executivo
     </Text>
     <View style={s.metricsRow}>
      <View style={s.metricCard}>
       <Text style={s.metricLabel}>Total de itens</Text>
       <Text style={s.metricValue}>{totalGeral.toLocaleString("pt-BR")}</Text>
      </View>
      <View style={s.metricCard}>
       <Text style={s.metricLabel}>Itens alocados</Text>
       <Text style={s.metricValue}>
        {totalAlocados.toLocaleString("pt-BR")}
       </Text>
      </View>
      <View style={s.metricCard}>
       <Text style={s.metricLabel}>Livres</Text>
       <Text style={s.metricValueGreen}>
        {(totalGeral - totalAlocados).toLocaleString("pt-BR")}
       </Text>
      </View>
      <View style={s.metricCard}>
       <Text style={s.metricLabel}>Ocupação geral</Text>
       <Text
        style={[
         pct(totalAlocados, totalGeral) >= 80
          ? s.metricValueAmber
          : s.metricValueGreen,
        ]}
       >
        {pct(totalAlocados, totalGeral)}%
       </Text>
      </View>
     </View>
    </View>

    {/* Sumário */}
    <View
     style={{
      borderWidth: 1,
      borderColor: c.slate100,
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 20,
     }}
    >
     <View style={[s.tableHeader, { paddingVertical: 8 }]}>
      <Text style={[s.tableHeaderCell, { flex: 2 }]}>Módulo</Text>
      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Total</Text>
      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Alocados</Text>
      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Livres</Text>
      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Ocupação</Text>
     </View>
     {[
      { label: "Máquinas", items: maquinas, color: c.blue },
      { label: "Notebooks", items: notebooks, color: c.violet },
      { label: "Aparelhos", items: aparelhos, color: c.cyan },
      { label: "Ramais", items: ramais, color: c.emerald },
     ].map(({ label, items, color }, idx) => {
      const aloc = items.filter(
       (i) => (i.alocacoes_ativas?.length ?? 0) > 0 || i.alocacao_ativa,
      ).length;
      const livres = Math.max(0, items.length - aloc);
      const ocp = pct(aloc, items.length);
      return (
       <View key={label} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
        <View
         style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 5 }}
        >
         <View
          style={{
           width: 8,
           height: 8,
           borderRadius: 4,
           backgroundColor: color,
          }}
         />
         <Text style={s.tableCell}>{label}</Text>
        </View>
        <Text style={[s.tableCell, { flex: 1 }]}>
         {items.length.toLocaleString("pt-BR")}
        </Text>
        <Text style={[s.tableCell, { flex: 1 }]}>
         {aloc.toLocaleString("pt-BR")}
        </Text>
        <Text style={[s.metricValueGreen, { flex: 1, fontSize: 8 }]}>
         {livres.toLocaleString("pt-BR")}
        </Text>
        <Text
         style={[
          ocp >= 80 ? s.metricValueAmber : s.metricValueGreen,
          { flex: 1, fontSize: 8 },
         ]}
        >
         {ocp}%
        </Text>
       </View>
      );
     })}
    </View>

    {/* ── Seção Máquinas ── */}
    <Section
     title="Máquinas"
     color={c.blue}
     items={maquinas}
     total={maquinas.length}
     geradoEm={gerado_em}
     getIdentifier={(i) => i.nome_host || i.identificador || "—"}
     getModelo={(i) =>
      [i.fabricante, i.modelo].filter(Boolean).join(" ") || "—"
     }
     getSetor={(i) => i.setor_nome || "—"}
     getExtra={(i) => i.categoria || "—"}
    />

    {/* ── Seção Notebooks ── */}
    <Section
     title="Notebooks"
     color={c.violet}
     items={notebooks}
     total={notebooks.length}
     geradoEm={gerado_em}
     getIdentifier={(i) => i.numero_patrimonio || i.modelo || "—"}
     getModelo={(i) =>
      [i.fabricante, i.modelo].filter(Boolean).join(" ") || "—"
     }
     getSetor={(i) => i.setor_nome || "—"}
     getExtra={(i) => i.categoria || "—"}
    />

    {/* Footer */}
    <View style={s.footer} fixed>
     <Text style={s.footerText}>IEC Inventário TI — Relatório Geral</Text>
     <Text
      style={s.pageNumber}
      render={({ pageNumber, totalPages }) =>
       `Pág. ${pageNumber} / ${totalPages}`
      }
     />
    </View>
   </Page>

   <Page size="A4" style={s.page}>
    {/* ── Seção Aparelhos ── */}
    <Section
     title="Aparelhos"
     color={c.cyan}
     items={aparelhos}
     total={aparelhos.length}
     geradoEm={gerado_em}
     getIdentifier={(i) => i.modelo || "—"}
     getModelo={(i) => i.modelo || "—"}
     getSetor={(i) => i.setor_nome || "—"}
    />

    {/* ── Seção Ramais ── */}
    <Section
     title="Ramais"
     color={c.emerald}
     items={ramais}
     total={ramais.length}
     geradoEm={gerado_em}
     getIdentifier={(i) =>
      i.numero_ramal != null ? String(i.numero_ramal) : "—"
     }
     getModelo={(i) => i.setor_nome || "—"}
     getSetor={(i) => i.prefixo_telefonico || "—"}
     getExtra={(i) => (i.fila ? "Fila" : i.contemplacao ? "Contemplado" : "—")}
    />
    <View style={s.footer} fixed>
     <Text style={s.footerText}>IEC Inventário TI — Relatório Geral</Text>
     <Text
      style={s.pageNumber}
      render={({ pageNumber, totalPages }) =>
       `Pág. ${pageNumber} / ${totalPages}`
      }
     />
    </View>
   </Page>
  </Document>
 );
}
