import { getSupabase } from '@/lib/supabase'

const BUCKET = 'forum-docs'

export async function uploadArquivo(
  file: Buffer,
  fileName: string,
  mimeType: string,
  pastaPath: string
): Promise<{ path: string; url: string }> {
  const ext      = fileName.split('.').pop()
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const fullPath = `${pastaPath}/${safeName}`
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, file, { contentType: mimeType, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
  return { path: fullPath, url: data.publicUrl }
}

export async function deleteArquivo(storagePath: string) {
  const supabase = getSupabase()
  await supabase.storage.from(BUCKET).remove([storagePath])
}
