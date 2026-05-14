import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SectorOverview, type LocationOverviewScope, type SectorOverviewRow } from "@/components/dashboard/sector-overview";
import { TrendingUp } from "lucide-react";
import { UltimasAuditoriasCard } from "@/components/dashboard/last-audits";
import { ExportPdfButton } from "@/components/dashboard/export-pdf-button";
import { GlobalSearch } from '@/components/layout/global-search'

export const dynamic = "force-dynamic";

type InventoryKpiItem = {
 setor_id: string | null
 localidade_id?: string | null
 created_at: Date | null
 unavailable: boolean
}

function monthStart(date: Date) {
 return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthEnd(date: Date) {
 return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function buildKpiSeries(items: InventoryKpiItem[]) {
 const base = monthStart(new Date())
 const months = Array.from({ length: 6 }, (_, index) => {
  const date = new Date(base)
  date.setMonth(base.getMonth() - (5 - index))
  return date
 })

 return months.map(month => {
  const end = monthEnd(month)
  const total = items.filter(item => item.created_at && item.created_at <= end).length
  const unavailable = items.filter(item => item.created_at && item.created_at <= end && item.unavailable).length

  return {
   label: month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").replace(" de ", "/"),
   total,
   available: Math.max(0, total - unavailable),
   unavailable,
  }
 })
}

async function getDashboardData() {
 const colaboradores = await prisma.colaboradores.count({ where: { status: "Ativo" } });
 const maquinas = await prisma.maquinas.count();
 const notebooks = await prisma.notebooks.count();
 const aparelhos = await prisma.aparelhos.count();
 const impressoras = await prisma.impressoras.count();
 const ramais = await prisma.ramais.count();
 const racks = await prisma.racks.count();

 // groupBy retorna um item por dispositivo único com ativo: true.
 // Mantemos as consultas sequenciais para não estourar o pooler do Supabase local.
 const maquinasAlocadasGroup = await prisma.alocacoes_maquinas.groupBy({
   by: ["maquina_id"],
   where: { ativo: true },
  });
 const notebooksAlocadosGroup = await prisma.alocacoes_notebooks.groupBy({
   by: ["notebook_id"],
   where: { ativo: true },
  });
 const notebooksEmprestados = await prisma.notebooks.findMany({
   where: { emprestado: true },
   select: { id: true },
  });
 const aparelhosAlocadosGroup = await prisma.alocacoes_aparelhos.groupBy({
   by: ["aparelho_id"],
   where: { ativo: true },
  });
 const ramaisAlocadosGroup = await prisma.alocacoes_ramais.groupBy({
   by: ["ramal_id"],
   where: { ativo: true },
  });

 const setores = await prisma.setores.findMany({
   orderBy: { nome: "asc" },
   include: {
    _count: {
     select: {
      colaboradores: true,
      maquinas: true,
      notebooks: true,
      aparelhos: true,
      impressoras: true,
      ramais: true,
      racks: true,
     },
    },
   },
  });
 const localidades = await prisma.localidades.findMany({
   orderBy: { nome: "asc" },
   include: {
    _count: {
     select: {
      colaboradores: true,
      maquinas: true,
      notebooks: true,
      aparelhos: true,
      impressoras: true,
      ramais: true,
      racks: true,
     },
    },
   },
  });

 const maquinasKpi = await prisma.maquinas.findMany({
  select: {
   setor_id: true,
   localidade_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });
 const notebooksKpi = await prisma.notebooks.findMany({
 select: {
   setor_id: true,
   localidade_id: true,
   created_at: true,
   emprestado: true,
   emprestado_setor_id: true,
   emprestado_colaborador: { select: { setor_id: true } },
   alocacoes: {
    where: { ativo: true },
    select: {
     id: true,
     colaborador: { select: { setor_id: true } },
    },
    take: 1,
   },
  },
 });
 const aparelhosKpi = await prisma.aparelhos.findMany({
  select: {
   setor_id: true,
   localidade_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });
 const ramaisKpi = await prisma.ramais.findMany({
  select: {
   setor_id: true,
   localidade_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });
 const colaboradoresKpi = await prisma.colaboradores.findMany({
  where: { status: "Ativo" },
  select: { setor_id: true, localidade_id: true },
 });
 const impressorasKpi = await prisma.impressoras.findMany({
  select: { setor_id: true, localidade_id: true },
 });
 const racksKpi = await prisma.racks.findMany({
  select: { setor_id: true, localidade_id: true },
 });

 function getNotebookSectorId(item: (typeof notebooksKpi)[number]) {
  return item.emprestado_colaborador?.setor_id
   ?? item.emprestado_setor_id
   ?? item.alocacoes[0]?.colaborador?.setor_id
   ?? item.setor_id
 }

 const kpiItems: InventoryKpiItem[] = [
  ...maquinasKpi.map(item => ({ setor_id: item.setor_id, localidade_id: item.localidade_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
  ...notebooksKpi.map(item => ({ setor_id: getNotebookSectorId(item), localidade_id: item.localidade_id, created_at: item.created_at, unavailable: item.emprestado || item.alocacoes.length > 0 })),
  ...aparelhosKpi.map(item => ({ setor_id: item.setor_id, localidade_id: item.localidade_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
  ...ramaisKpi.map(item => ({ setor_id: item.setor_id, localidade_id: item.localidade_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
 ];

 const notebookUnavailableIds = new Set([
  ...notebooksAlocadosGroup.map(item => item.notebook_id).filter(Boolean),
  ...notebooksEmprestados.map(item => item.id),
 ]);

 const notebooksPorSetor = new Map<string, number>()
 for (const notebook of notebooksKpi) {
  const setorId = getNotebookSectorId(notebook)
  if (!setorId) continue
  notebooksPorSetor.set(setorId, (notebooksPorSetor.get(setorId) ?? 0) + 1)
 }

 const setoresOverview: SectorOverviewRow[] = setores.map(setor => ({
  id: setor.id,
  nome: setor.nome,
  descricao: setor.descricao,
  ativo: setor.ativo,
  created_at: setor.created_at?.toISOString() ?? null,
  counts: {
   colaboradores: countByScope(colaboradoresKpi, setor.id),
   maquinas: setor._count.maquinas,
   notebooks: notebooksPorSetor.get(setor.id) ?? 0,
   aparelhos: setor._count.aparelhos,
   impressoras: setor._count.impressoras,
   ramais: setor._count.ramais,
   racks: setor._count.racks,
  },
  kpi: buildKpiSeries(kpiItems.filter(item => item.setor_id === setor.id)),
 }));
 function countByScope<T extends { setor_id: string | null; localidade_id: string | null }>(
  items: T[],
  setorId: string,
  localidadeId?: string
 ) {
  return items.filter(item =>
   item.setor_id === setorId &&
   (!localidadeId || item.localidade_id === localidadeId)
  ).length
 }

 function buildSetorRow(setor: (typeof setores)[number], localidadeId?: string): SectorOverviewRow {
  return {
   id: setor.id,
   nome: setor.nome,
   descricao: setor.descricao,
   ativo: setor.ativo,
   created_at: setor.created_at?.toISOString() ?? null,
   counts: {
    colaboradores: countByScope(colaboradoresKpi, setor.id, localidadeId),
    maquinas: localidadeId ? countByScope(maquinasKpi, setor.id, localidadeId) : setor._count.maquinas,
    notebooks: localidadeId ? countByScope(notebooksKpi.map(item => ({ ...item, setor_id: getNotebookSectorId(item) })), setor.id, localidadeId) : notebooksPorSetor.get(setor.id) ?? 0,
    aparelhos: localidadeId ? countByScope(aparelhosKpi, setor.id, localidadeId) : setor._count.aparelhos,
    impressoras: localidadeId ? countByScope(impressorasKpi, setor.id, localidadeId) : setor._count.impressoras,
    ramais: localidadeId ? countByScope(ramaisKpi, setor.id, localidadeId) : setor._count.ramais,
    racks: localidadeId ? countByScope(racksKpi, setor.id, localidadeId) : setor._count.racks,
   },
   kpi: buildKpiSeries(kpiItems.filter(item => item.setor_id === setor.id && (!localidadeId || item.localidade_id === localidadeId))),
  }
 }

 const locationScopes: LocationOverviewScope[] = localidades.map(localidade => {
  const scopedSetores = setores
   .map(setor => buildSetorRow(setor, localidade.id))
   .filter(setor => Object.values(setor.counts).some(count => count > 0))
  return {
   id: localidade.id,
   nome: localidade.nome,
   counts: {
    colaboradores: colaboradoresKpi.filter(colaborador => colaborador.localidade_id === localidade.id).length,
    maquinas: localidade._count.maquinas,
    notebooks: localidade._count.notebooks,
    aparelhos: localidade._count.aparelhos,
    impressoras: localidade._count.impressoras,
    ramais: localidade._count.ramais,
    racks: localidade._count.racks,
   },
   setores: scopedSetores,
  }
 });

 return {
  stats: {
   colaboradores,
   maquinas,
   notebooks,
   aparelhos,
   impressoras,
   ramais,
   racks,
   maquinasAlocadas: maquinasAlocadasGroup.length,
   notebooksAlocados: notebookUnavailableIds.size,
   aparelhosAlocados: aparelhosAlocadosGroup.length,
   ramaisAlocados: ramaisAlocadosGroup.length,
  },
  setoresOverview,
  locationScopes,
 };
}

export default async function DashboardPage() {
 const { stats, setoresOverview, locationScopes } = await getDashboardData();

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="flex items-center gap-4 mb-5">
  {/* Título — lado esquerdo */}
  <div className="shrink-0">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
      Dashboard
    </h1>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
      Visão geral do inventário de TI
    </p>
  </div>

  {/* Search — centro, cresce para preencher o espaço disponível */}
  <GlobalSearch className="flex-1 min-w-0" />

  {/* Ações — lado direito */}
  <div className="flex items-center gap-2 shrink-0">
    <div className="flex items-center gap-2 text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5">
      <TrendingUp className="w-3.5 h-3.5" />
      Atualizado agora
    </div>
    <ExportPdfButton />
  </div>
</div>

   <SectorOverview setores={setoresOverview} locationScopes={locationScopes} />

   {/* Stats */}
   <StatsCards stats={stats} />

   {/* Últimas Movimentações */}
   <UltimasAuditoriasCard />
  </div>
 );
}
