const bcrypt = require('bcryptjs')
const express = require('express')
const { rateLimit } = require('express-rate-limit')
const User = require('../models/User')
const router = express.Router()

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.',
  }),
})

router.post('/register', registerLimiter, async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Dados de cadastro inválidos.' })
  }

  const { name, email, password } = req.body
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

  if (!normalizedName || normalizedName.length > 100) {
    return res.status(400).json({ error: 'Informe um nome com até 100 caracteres.' })
  }
  if (!validEmail || normalizedEmail.length > 254) {
    return res.status(400).json({ error: 'Informe um e-mail válido com até 254 caracteres.' })
  }
  if (typeof password !== 'string' || Array.from(password).length < 8) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' })
  }
  if (bcrypt.truncates(password)) {
    return res.status(400).json({ error: 'A senha não pode exceder 72 bytes em UTF-8.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
    })

    return res.status(201).json({ user: 'Usuario Registrado' })
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({ error: 'Não foi possível concluir o cadastro.' })
    }

    return res.status(503).json({ error: 'Serviço de cadastro indisponível.' })
  }
})

module.exports = app => app.use('/auth', router)
