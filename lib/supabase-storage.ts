import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, file, { contentType: mimeType, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
  return { path: fullPath, url: data.publicUrl }
}

export async function deleteArquivo(storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath])
}