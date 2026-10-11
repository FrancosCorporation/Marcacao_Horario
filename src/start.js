const express = require('express')
const app = express()
const rawPort = process.env.PORT || '3000'
const port = Number(rawPort)

if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
  console.error('PORT deve ser um número entre 1 e 65535.')
  process.exit(1)
}

require('./database')
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false, limit: '10kb' }))
require('./controller/authController')(app)

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisição excede o limite de 10 KB.' })
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'JSON inválido.' })
  }

  return res.status(500).json({ error: 'Erro interno do servidor.' })
})

const server = app.listen(port, () => {
  console.log('Listening on http://localhost:' + port)
})
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Porta ' + port + ' já está em uso. Defina PORT=<outra porta> e tente novamente.')
    process.exit(1)
  }
  throw err
})
