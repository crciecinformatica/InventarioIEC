'use client'

import { useState } from 'react'
import { X, Loader2, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { formatDate } from '@/lib/utils'

const newSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  perfil: z.enum(['admin', 'viewer']),
  ativo: z.boolean(),
})

const editSchema = z.object({
  id: z.string(),
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  perfil: z.enum(['admin', 'viewer']),
  ativo: z.boolean(),
})

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
  created_at: string | null
}

interface Props {
  usuario?: Usuario
  onClose: () => void
  onRefresh: () => void
}

export function UsuarioModal({ usuario, onClose, onRefresh }: Props) {
  const isNew = !usuario
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isNew ? newSchema : editSchema),
    defaultValues: {
      id: usuario?.id || '',
      nome: usuario?.nome || '',
      email: usuario?.email || '',
      senha: '',
      perfil: (usuario?.perfil as 'admin' | 'viewer') || 'viewer',
      ativo: usuario?.ativo ?? true,
    },
  })

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
  const errCls = "text-xs text-red-500 mt-0.5"

  async function onSubmit(data: any) {
    setSaving(true)
    try {
      const payload: any = { id: data.id, nome: data.nome, email: data.email, perfil: data.perfil, ativo: data.ativo }
      if (data.senha) payload.senha = data.senha

      const res = await fetch(
        isNew ? '/api/admin/usuarios' : `/api/admin/usuarios/${usuario!.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (res.status === 409) { toast.error('E-mail já cadastrado.'); return }
      if (!res.ok) throw new Error()
      toast.success(isNew ? 'Usuário criado com sucesso!' : 'Usuário atualizado!')
      onRefresh()
      onClose()
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Usuário desativado.')
      onRefresh()
      onClose()
    } catch {
      toast.error('Erro ao desativar.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {isNew ? 'Novo Usuário' : `Editar: ${usuario.nome}`}
                </h2>
                {!isNew && <p className="text-xs text-slate-400">Cadastrado em {formatDate(usuario.created_at)}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="usuario-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className={labelCls}>Nome completo</label>
              <input {...register('nome')} className={inputCls} placeholder="Nome Sobrenome" />
              {errors.nome && <p className={errCls}>{errors.nome.message as string}</p>}
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input {...register('email')} type="email" className={inputCls} placeholder="email@iec.com.br" />
              {errors.email && <p className={errCls}>{errors.email.message as string}</p>}
            </div>
            <div>
              <label className={labelCls}>
                {isNew ? 'Senha' : 'Nova senha'}{!isNew && <span className="text-slate-400 ml-1">(deixe vazio para manter)</span>}
              </label>
              <div className="relative">
                <input
                  {...register('senha')}
                  type={showSenha ? 'text' : 'password'}
                  className={`${inputCls} pr-10`}
                  placeholder={isNew ? 'Mínimo 6 caracteres' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && <p className={errCls}>{errors.senha.message as string}</p>}
            </div>
            <div>
              <label className={labelCls}>Perfil de acesso</label>
              <select {...register('perfil')} className={inputCls}>
                <option value="viewer">Visualizador — somente leitura</option>
                <option value="admin">Administrador — acesso total</option>
              </select>
            </div>
            {!isNew && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <input
                  {...register('ativo')}
                  type="checkbox"
                  id="ativo"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Usuário ativo (pode fazer login)
                </label>
              </div>
            )}
          </form>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {!isNew && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
                title="Desativar usuário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Cancelar
            </button>
            <button
              type="submit"
              form="usuario-form"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isNew ? 'Criar usuário' : 'Salvar alterações'}
            </button>
          </div>
        </aside>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Desativar usuário"
          description={`Desativar "${usuario?.nome}"? O usuário perderá o acesso ao sistema, mas o registro será mantido.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}