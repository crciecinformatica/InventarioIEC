"use client";
import { usePermission } from '@/hooks/use-permission'

import { useState } from "react";
import { X, Pencil, Trash2, Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CategoriaBadge } from "@/components/dashboard/status-badge";
import { DetailField, DetailSection } from "@/components/modals/detail-field";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { ColaboradorSelect } from "@/components/modals/colaborador-select";
import { useCrud } from "@/hooks/use-crud";
import { formatDate } from "@/lib/utils";
import type { Maquina } from "@/types";
import { HistoricoPanel } from "./historico-panel";
import { AlocacoesAtivasSection } from "./alocacoes-ativas-section";
import { SetorSelect } from "./setor-select";
import { LocalidadeSelect } from "./localidade-select";
import { AnimatedDialogFrame } from "@/components/layout/motion-primitives";
import { DeviceCommentsPopover } from "@/components/forum/device-comments-popover";
import { useSolicitacaoInventarioConfirm } from "@/components/solicitacoes-inventario/solicitacao-confirm-provider";

const schema = z.object({
 nome_host: z.string().optional().nullable(),
 fabricante: z.string().optional().nullable(),
 modelo: z.string().optional().nullable(),
 categoria: z.enum(["Administrativa", "Academica", "Backup"]).optional().nullable(),
 processador: z.string().optional().nullable(),
 memoria_ram: z.string().optional().nullable(),
 armazenamento: z.string().optional().nullable(),
 endereco_ip: z.string().optional().nullable(),
 patrimonio_cpu: z.string().optional().nullable(),
 patrimonio_monitor: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

interface Props {
 maquina: Maquina;
 onClose: () => void;
 onRefresh: () => void;
}

export function MaquinaModal({ maquina, onClose, onRefresh }: Props) {
 const { isAdmin, canRequestInventoryChanges } = usePermission()
 const confirmSolicitacao = useSolicitacaoInventarioConfirm()
 const [mode, setMode] = useState<"view" | "edit">("view");
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [showDesalocarConfirm, setShowDesalocarConfirm] = useState(false);
 const [colabId, setColabId] = useState("");
 const [colabNome, setColabNome] = useState("");
 const [savingAlocacao, setSavingAlocacao] = useState(false);
 const [setorId, setSetorId] = useState<string | null>(
  maquina.setor_id ?? null
 )
 const [localidadeId, setLocalidadeId] = useState<string | null>(
  maquina.localidade_id ?? null
 )

 const { update, remove, saving, deleting } = useCrud("maquinas", () => {
  onRefresh();
  onClose();
 });

 const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {
   nome_host: maquina.nome_host,
   fabricante: maquina.fabricante,
   modelo: maquina.modelo,
   categoria: maquina.categoria,
   processador: maquina.processador,
   memoria_ram: maquina.memoria_ram,
   armazenamento: maquina.armazenamento,
   endereco_ip: maquina.endereco_ip,
   patrimonio_cpu: maquina.patrimonio_cpu,
   patrimonio_monitor: maquina.patrimonio_monitor,
  },
 });

 function onSubmit(data: FormData) {
  update(maquina.id, { ...data, setor_id: setorId, localidade_id: localidadeId }, {
    previousData: maquina,
    label: `Máquina "${maquina.nome_host ?? maquina.identificador}" atualizada`,
  })
}

 async function alocar() {
  if (!colabId) return;
  setSavingAlocacao(true);
  try {
   if (!isAdmin) {
    const solicitacao = await confirmSolicitacao()
    if (!solicitacao.confirmed) return
    const res = await fetch('/api/solicitacoes-inventario', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      tipo_recurso: 'alocacoes_maquinas',
      acao: 'ALLOCATE',
      dados_propostos: { maquina_id: maquina.id, colaborador_id: colabId },
      comentario: solicitacao.comentario,
     }),
    })
    if (!res.ok) throw new Error()
    toast.success('Solicitação enviada para aprovação.')
    onClose()
    return
   }
   const res = await fetch("/api/alocacoes/maquinas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maquina_id: maquina.id, colaborador_id: colabId }),
   });
   if (!res.ok) throw new Error();
   toast.success("Máquina alocada com sucesso!");
   onRefresh();
   onClose();
  } catch {
   toast.error("Erro ao alocar.");
  } finally {
   setSavingAlocacao(false);
  }
 }

 async function desalocar() {
  setSavingAlocacao(true);
  try {
   if (!isAdmin) {
    const activeId = maquina.alocacoes_ativas?.[0]?.id
    if (!activeId) throw new Error()
    const solicitacao = await confirmSolicitacao()
    if (!solicitacao.confirmed) return
    const res = await fetch('/api/solicitacoes-inventario', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      tipo_recurso: 'alocacoes_maquinas',
      recurso_id: activeId,
      acao: 'DEALLOCATE',
      dados_anteriores: maquina.alocacoes_ativas?.[0] ?? null,
      dados_propostos: {},
      comentario: solicitacao.comentario,
     }),
    })
    if (!res.ok) throw new Error()
    toast.success('Solicitação enviada para aprovação.')
    onClose()
    return
   }
   const res = await fetch(`/api/alocacoes/maquinas/${maquina.id}/ativo`, {
    method: "DELETE",
   });
   if (!res.ok) throw new Error();
   toast.success("Alocação encerrada.");
   onRefresh();
   onClose();
  } catch {
   toast.error("Erro ao desalocar.");
  } finally {
   setSavingAlocacao(false);
  }
 }

 const inp =
  "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
 const lbl =
  "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

 return (
  <>
   <DeviceCommentsPopover
    tipoItem="maquinas"
    itemId={maquina.id}
    itemLabel={maquina.nome_host ?? maquina.identificador}
   />
   <AnimatedDialogFrame onClose={onClose} className="flex max-h-[90vh] max-w-4xl flex-col rounded-2xl">
     <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
      <div>
       <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {mode === "edit" ? "Editar Máquina" : maquina.nome_host || "Máquina"}
       </h2>
       {mode === "view" && (
        <div className="flex items-center gap-2 mt-1">
         <CategoriaBadge categoria={maquina.categoria} />
         {maquina.identificador && (
          <span className="text-xs text-slate-400">
           {maquina.identificador}
          </span>
         )}
        </div>
       )}
      </div>
      <button
       type="button"
       onClick={onClose}
       className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
       <X className="w-4 h-4" />
      </button>
     </div>

     {mode === "view" && (
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
       {maquina.alocacao_ativa ? (
        <AlocacoesAtivasSection
         itemId={maquina.id}
         entidade="maquinas"
         alocacoes={(maquina.alocacoes_ativas ?? []).map((a) => ({
          id: a.id,
          colaborador: {
           id: a.colaborador.id,
           nome: a.colaborador.nome,
           setor_rel: {
            nome: a.colaborador.setor_rel?.nome ?? null,
           },
          },
          data_inicio: a.data_inicio ?? null,
         }))}
         onRefresh={onRefresh}
         onClose={onClose}
        />
       ) : (
        (isAdmin || canRequestInventoryChanges) && (
        <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
         <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
           Alocar Colaborador
          </span>
         </div>
         <ColaboradorSelect
          value={colabId}
          onChange={(id, nome) => {
           setColabId(id);
           setColabNome(nome);
          }}
          onClear={() => {
           setColabId("");
           setColabNome("");
          }}
          selectedNome={colabNome}
         />
         {colabId && (
          <button
           type="button"
           onClick={(e) => {
            e.preventDefault();
            alocar();
           }}
           disabled={savingAlocacao}
           className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition"
          >
           {savingAlocacao && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
           Confirmar alocação
          </button>
         )}
        </div>
        )
       )}

       <DetailSection title="Identificação">
        <DetailField label="Nome Host" value={maquina.nome_host} />
        <DetailField label="Identificador" value={maquina.identificador} />
        <DetailField label="Patrimônio CPU" value={maquina.patrimonio_cpu} />
        <DetailField
         label="Patrimônio Monitor"
         value={maquina.patrimonio_monitor}
        />
       </DetailSection>
       <DetailSection title="Hardware">
        <DetailField label="Fabricante" value={maquina.fabricante} />
        <DetailField label="Modelo" value={maquina.modelo} />
        <DetailField label="Processador" value={maquina.processador} />
        <DetailField label="Memória RAM" value={maquina.memoria_ram} />
        <DetailField label="Armazenamento" value={maquina.armazenamento} />
       </DetailSection>
       <DetailSection title="Rede e Localização">
        <DetailField label="Endereço IP" value={maquina.endereco_ip} />
        <DetailField label="Setor" value={maquina.setor_nome ?? '—'} />
        <DetailField label="Localidade" value={maquina.localidade_nome ?? '—'} />
        <DetailField
         label="Categoria"
         value={<CategoriaBadge categoria={maquina.categoria} />}
        />
        <DetailField
         label="Data Revisão"
         value={formatDate(maquina.data_revisao)}
        />
       </DetailSection>
       <HistoricoPanel registroId={maquina.id} tabela="maquinas" />
      </div>
     )}

     {mode === "edit" && (
      <div className="flex-1 overflow-y-auto p-5">
       <form
        id="maq-form"
        onSubmit={(e) => {
         e.preventDefault();
         handleSubmit(onSubmit)(e);
        }}
        noValidate
       >
        <div className="grid grid-cols-2 gap-3">
         <div>
          <label className={lbl}>Nome Host</label>
          <input {...register("nome_host")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Fabricante</label>
          <input {...register("fabricante")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Modelo</label>
          <input {...register("modelo")} className={inp} />
         </div>
         <div className="col-span-2">
          <label className={lbl}>Categoria</label>
          <select {...register("categoria")} className={inp}>
           <option value="">Selecione...</option>
           <option value="Administrativa">Administrativa</option>
           <option value="Academica">Acadêmica</option>
           <option value="Backup">Backup</option>
          </select>
         </div>
         <div>
          <label className={lbl}>Processador</label>
          <input {...register("processador")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Memória RAM</label>
          <input {...register("memoria_ram")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Armazenamento</label>
          <input {...register("armazenamento")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Endereço IP</label>
          <input {...register("endereco_ip")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Setor</label>
         <SetorSelect
           value={setorId}
           onChange={(id) =>
            setSetorId(id)
           }
          />
         </div>
         <div>
          <label className={lbl}>Localidade</label>
          <LocalidadeSelect
           value={localidadeId}
           onChange={(id) => { setLocalidadeId(id) }}
          />
         </div>
         <div>
          <label className={lbl}>Patrimônio CPU</label>
          <input {...register("patrimonio_cpu")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Patrimônio Monitor</label>
          <input {...register("patrimonio_monitor")} className={inp} />
         </div>
        </div>
       </form>
      </div>
     )}

     <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
      {mode === "view" ? (
       <>
{(isAdmin || canRequestInventoryChanges) && (        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
         }}
         className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
        >
         <Trash2 className="w-3.5 h-3.5" /> Excluir
        </button>)}
{(isAdmin || canRequestInventoryChanges) && (        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setMode("edit");
         }}
         className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
         <Pencil className="w-3.5 h-3.5" /> Editar
        </button>)}
       </>
      ) : (
       <>
        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setMode("view");
         }}
         className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
         Cancelar
        </button>
        <button
         type="submit"
         form="maq-form"
         disabled={saving}
         className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
        >
         {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
         Salvar alterações
        </button>
       </>
      )}
     </div>
   </AnimatedDialogFrame>

   {showDeleteConfirm && (
    <ConfirmDialog
     title="Excluir máquina"
     description={`Excluir "${maquina.nome_host || maquina.identificador}"? Esta ação não pode ser desfeita.`}
     onConfirm={() => remove(maquina.id)}
     onCancel={() => setShowDeleteConfirm(false)}
     loading={deleting}
    />
   )}

   {showDesalocarConfirm && (
    <ConfirmDialog
     title="Encerrar alocação"
     description={`Desalocar "${maquina.alocacao_ativa?.colaborador.nome}" desta máquina?`}
     onConfirm={desalocar}
     onCancel={() => setShowDesalocarConfirm(false)}
     loading={savingAlocacao}
    />
   )}
  </>
 );
}
