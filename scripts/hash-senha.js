/**
 * Script para criar o hash bcrypt de uma senha para cadastro de usuário.
 * 
 * Uso:
 *   node scripts/hash-senha.js "minha_senha_aqui"
 * 
 * O hash gerado deve ser inserido na tabela `usuarios` do Supabase.
 */

const bcrypt = require('bcryptjs')

const senha = process.argv[2]

if (!senha) {
  console.error('❌ Informe a senha como argumento: node scripts/hash-senha.js "minha_senha"')
  process.exit(1)
}

bcrypt.hash(senha, 10).then((hash) => {
  console.log('\n✅ Hash gerado com sucesso!\n')
  console.log('Senha:', senha)
  console.log('Hash: ', hash)
  console.log('\n📋 SQL para inserir no Supabase:')
  console.log(`\nINSERT INTO usuarios (nome, email, senha_hash, perfil)`)
  console.log(`VALUES ('Nome Completo', 'email@iec.com.br', '${hash}', 'viewer');\n`)
})
