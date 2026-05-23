"use client";
import { usePermission } from '@/hooks/use-permission'
import { useState } from "react";
import { X, Pencil, Trash2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BoolBadge } from "@/components/dashboard/status-badge";
import { DetailField, DetailSection } from "@/components/modals/detail-field";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { useCrud } from "@/hooks/use-crud";
import type { Ramal } from "@/types";
import { HistoricoPanel } from "./historico-panel";
import { AlocacoesAtivasSection } from "@/components/modals/alocacoes-ativas-section";
import { SetorSelect } from "./setor-select";
import { LocalidadeSelect } from "./localidade-select";
import { AnimatedDialogFrame } from "@/components/layout/motion-primitives";

const schema = z.object({
 numero_ramal: z.string().optional().nullable(),
 prefixo_telefonico: z.string().optional().nullable(),
 senha_acesso: z.string().optional().nullable(),
 disponibilidade: z.string().optional().nullable(),
 fila: z.boolean().optional().nullable(),
 contemplacao: z.boolean().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
 ramal: Ramal;
 onClose: () => void;
 onRefresh: () => void;
}

export function RamalModal({ ramal, onClose, onRefresh }: Props) {
 const [mode, setMode] = useState<"view" | "edit">("view");
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [setorId, setSetorId] = useState<string | null>(
    ramal.setor_id ?? null
  )
 const [localidadeId, setLocalidadeId] = useState<string | null>(
    ramal.localidade_id ?? null
  )
  
  const { isAdmin } = usePermission()

 const { update, remove, saving, deleting } = useCrud("ramais", () => {
  onRefresh();
  onClose();
 });

 const { register, handleSubmit } = useForm<FormData>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(schema) as any,
  defaultValues: {
   numero_ramal: ramal.numero_ramal,
   prefixo_telefonico: ramal.prefixo_telefonico,
   senha_acesso: ramal.senha_acesso,
   disponibilidade: ramal.disponibilidade,
   fila: ramal.fila,
   contemplacao: ramal.contemplacao,
  },
 });

 function onSubmit(data: FormData) {
  update(ramal.id, { ...data, setor_id: setorId, localidade_id: localidadeId }, {
    previousData: ramal,
    label: `Ramal "${ramal.numero_ramal}" atualizado`,
  })
}

 const inp =
  "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
 const lbl =
  "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

 return (
  <>
   <AnimatedDialogFrame onClose={onClose} className="flex max-h-[90vh] max-w-4xl flex-col rounded-2xl">
     <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
      <div>
       <h2 className="text-base font-semibold text-slate-900 dark:text-white font-mono">
        {mode === "edit"
         ? "Editar Ramal"
         : `Ramal ${ramal.numero_ramal ?? "—"}`}
       </h2>
       {mode === "view" && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
         {ramal.setor_nome || "—"}
        </p>
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
       <AlocacoesAtivasSection
        itemId={ramal.id}
        entidade="ramais"
        alocacoes={(ramal.alocacoes_ativas ?? []).map((a) => ({
         id: a.id,
         colaborador: {
                      nome: a.colaborador.nome,
                      setor_rel: {
                        nome: a.colaborador.setor_rel?.nome ?? null,
                      },
                    },
         data_inicio: a.data_inicio ?? null,
         whatsapp: a.whatsapp,
        }))}
        onRefresh={onRefresh}
        onClose={onClose}
       />

       <DetailSection title="Informações do Ramal">
        <DetailField
         label="Número"
         value={ramal.numero_ramal != null ? String(ramal.numero_ramal) : null}
        />
        <DetailField label="Setor" value={ramal.setor_nome ?? '—'} />
        <DetailField label="Localidade" value={ramal.localidade_nome ?? '—'} />
        <DetailField
         label="Prefixo Telefônico"
         value={ramal.prefixo_telefonico}
        />
        <DetailField
         label="Senha de Acesso"
         value={ramal.senha_acesso || "—"}
        />
        <DetailField label="Disponibilidade" value={ramal.disponibilidade} />
        <DetailField label="Fila" value={<BoolBadge value={ramal.fila} />} />
        <DetailField
         label="Contemplação"
         value={<BoolBadge value={ramal.contemplacao} />}
        />
       </DetailSection>
       <HistoricoPanel registroId={ramal.id} tabela="ramais" />
      </div>
     )}

     {mode === "edit" && (
      <div className="flex-1 overflow-y-auto p-5">
       <form
        id="ramal-form"
        onSubmit={(e) => {
         e.preventDefault();
         handleSubmit(onSubmit)(e);
        }}
        noValidate
       >
        <div className="grid grid-cols-2 gap-3">
         <div>
          <label className={lbl}>Número do Ramal</label>
          <input
           type="text"
           {...register("numero_ramal")}
           className={inp}
           placeholder="Ex: 0028"
           onInput={(e) => {
            const input = e.currentTarget;
            // Aceita apenas dígitos
            input.value = input.value.replace(/[^0-9]/g, "");
           }}
          />
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
          <label className={lbl}>Prefixo Telefônico</label>
          <input {...register("prefixo_telefonico")} className={inp} />
         </div>
         <div className="col-span-2">
          <label className={lbl}>Senha de Acesso</label>
          <input
           type="text"
           {...register("senha_acesso")}
           className={inp}
           placeholder="Senha do ramal"
           autoComplete="off"
          />
         </div>
         <div>
          <label className={lbl}>Disponibilidade</label>
          <input {...register("disponibilidade")} className={inp} />
         </div>
         <div className="flex items-center gap-2 pt-4">
          <input
           type="checkbox"
           id="fila-edit"
           {...register("fila")}
           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label
           htmlFor="fila-edit"
           className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
          >
           Fila
          </label>
         </div>
         <div className="flex items-center gap-2 pt-4">
          <input
           type="checkbox"
           id="cont-edit"
           {...register("contemplacao")}
           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label
           htmlFor="cont-edit"
           className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
          >
           Contemplação
          </label>
         </div>
        </div>
       </form>
      </div>
     )}

     <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
      {mode === "view" ? (
       <>
{isAdmin && (        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
         }}
         className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
        >
         <Trash2 className="w-3.5 h-3.5" /> Excluir
        </button>)}
{isAdmin && (        <button
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
         form="ramal-form"
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
     title="Excluir ramal"
     description={`Excluir ramal ${ramal.numero_ramal}? Esta ação não pode ser desfeita.`}
     onConfirm={() => remove(ramal.id)}
     onCancel={() => setShowDeleteConfirm(false)}
     loading={deleting}
    />
   )}
  </>
 );
}
