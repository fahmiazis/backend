const route = require('express').Router()
const show = require('../controllers/show')

route.get('/get/:id', show.showDokumen)

module.exports = route
