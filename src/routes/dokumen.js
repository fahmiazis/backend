const route = require('express').Router()
const dokumen = require('../controllers/documents')

route.post('/add', dokumen.addDocument)
route.get('/get', dokumen.getDocuments)
route.patch('/update/:id', dokumen.updateDocument)
route.delete('/delete/:id', dokumen.deleteDocuments)
route.get('/detail/:id', dokumen.getDetailDocument)

module.exports = route