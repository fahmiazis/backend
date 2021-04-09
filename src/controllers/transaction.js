const { pagination } = require('../helpers/pagination')
const { documents, sequelize, Path, depo, activity } = require('../models')
const { Op, QueryTypes } = require('sequelize')
const response = require('../helpers/response')
const joi = require('joi')
const uploadHelper = require('../helpers/upload')
const multer = require('multer')
// const fs = require('fs')
// const vs = require('fs-extra')
// const { APP_URL } = process.env
const moment = require('moment')

module.exports = {
  dashboard: async (req, res) => {
    try {
      let { limit, page, search, sort, typeSort } = req.query
      let searchValue = ''
      let sortValue = ''
      let typeSortValue = ''
      if (typeof search === 'object') {
        searchValue = Object.values(search)[0]
      } else {
        searchValue = search || 'daily'
      }
      if (typeof sort === 'object') {
        sortValue = Object.values(sort)[0]
      } else {
        sortValue = sort || 'id'
      }
      if (typeof typeSort === 'object') {
        typeSortValue = Object.values(typeSort)[0]
      } else {
        typeSortValue = typeSort || 'ASC'
      }
      if (!limit) {
        limit = 5
      } else {
        limit = parseInt(limit)
      }
      if (!page) {
        page = 1
      } else {
        page = parseInt(page)
      }
      //   const id = req.user.id
      const level = req.user.level
      const kode = req.user.kode
      const time = moment().utc().format('YYYY-MM-DD')
      if (level === 4) {
        const result = await depo.findOne({
          where: {
            kode_plant: kode
          }
        })
        if (result) {
          const cabang = result.status_depo
          const results = await documents.findAndCountAll({
            where: {
              [Op.and]: [
                { uploadedBy: 'sa' },
                { status: 'active' }
              ],
              [Op.or]: [
                { nama_dokumen: { [Op.like]: `%${searchValue}%` } },
                { jenis_dokumen: { [Op.like]: `%${searchValue}%` } }
              ],
              status_depo: cabang
            },
            order: [[sortValue, typeSortValue]],
            limit: limit,
            offset: (page - 1) * limit
          })
          const pageInfo = pagination('/dokumen/get', req.query, page, limit, results.count)
          if (results) {
            const cek = await sequelize.query(`SELECT kode_plant, tipe from activities WHERE (kode_plant='${kode}' AND tipe='sa') AND createdAt LIKE '%${time}%' LIMIT 1`, {
              type: QueryTypes.SELECT
            })
            if (cek.length > 0) {
              return response(res, 'list dokumen', { results, pageInfo })
            } else {
              const data = {
                kode_plant: kode,
                status: 'Belum Upload',
                documentDate: results.postDokumen,
                access: 'unlock',
                jenis_dokumen: searchValue === 'daily' ? 'daily' : 'monthly',
                tipe: 'sa'
              }
              const create = await activity.create(data)
              if (create) {
                return response(res, 'list dokumen', { results, pageInfo })
              } else {
                return response(res, 'failed to get dokumen', {}, 404, false)
              }
            }
          } else {
            return response(res, 'failed to get user', {}, 404, false)
          }
        } else {
          return response(res, 'user tidak terhubung dengan depo manapun', {}, 404, false)
        }
      } else if (level === 5) {
        const result = await depo.findOne({
          where: {
            kode_plant: kode
          }
        })
        if (result) {
          const cabang = result.status_depo
          const results = await documents.findAndCountAll({
            where: {
              [Op.and]: [
                { uploadedBy: 'kasir' },
                { status: 'active' }
              ],
              [Op.or]: [
                { nama_dokumen: { [Op.like]: `%${searchValue}%` } },
                { jenis_dokumen: { [Op.like]: `%${searchValue}%` } }
              ],
              status_depo: cabang
            },
            order: [[sortValue, typeSortValue]],
            limit: limit,
            offset: (page - 1) * limit
          })
          const pageInfo = pagination('/dokumen/get', req.query, page, limit, results.count)
          if (results) {
            const cek = await sequelize.query(`SELECT kode_plant, tipe from activities WHERE (kode_plant='${kode}' AND tipe='kasir') AND createdAt LIKE '%${time}%' LIMIT 1`, {
              type: QueryTypes.SELECT
            })
            if (cek.length > 0) {
              return response(res, 'list dokumen', { results, pageInfo })
            } else {
              const data = {
                kode_plant: kode,
                status: 'Belum Upload',
                access: 'unlock',
                jenis_dokumen: searchValue === 'daily' ? 'daily' : 'monthly',
                tipe: 'kasir'
              }
              const create = await activity.create(data)
              if (create) {
                return response(res, 'list dokumen', { results, pageInfo })
              } else {
                return response(res, 'failed to get dokumen', {}, 404, false)
              }
            }
          } else {
            return response(res, 'failed to get dokumen', {}, 404, false)
          }
        } else {
          return response(res, 'user tidak terhubung dengan depo manapun', {}, 404, false)
        }
      } else if (level === 1 || level === 2 || level === 3) {
        const results = await documents.findAndCountAll({
          where: {
            [Op.or]: [
              { nama_dokumen: { [Op.like]: `%${searchValue}%` } },
              { jenis_dokumen: { [Op.like]: `%${searchValue}%` } }
            ]
          },
          order: [[sortValue, typeSortValue]],
          limit: limit,
          offset: (page - 1) * limit
        })
        const pageInfo = pagination('/dokumen/get', req.query, page, limit, results.count)
        if (results) {
          return response(res, 'list dokumen', { results, pageInfo })
        } else {
          return response(res, 'failed to get dokumen', {}, 404, false)
        }
      }
    } catch (error) {
      return response(res, error.message, {}, 500, false)
    }
  },
  uploadDocument: async (req, res) => {
    const id = req.params.id
    const level = req.user.level
    const kode = req.user.kode
    const time = moment().utc().format('YYYY-MM-DD')
    uploadHelper(req, res, async function (err) {
      try {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE' && req.files.length === 0) {
            console.log(err.code === 'LIMIT_UNEXPECTED_FILE' && req.files.length > 0)
            return response(res, 'fieldname doesnt match', {}, 500, false)
          }
          return response(res, err.message, {}, 500, false)
        } else if (err) {
          return response(res, err.message, {}, 401, false)
        }
        const dokumen = `uploads/${req.files[0].filename}`
        if (level === 5) {
          const result = await documents.findByPk(id)
          if (result) {
            const cek = await sequelize.query(`SELECT id from activities WHERE (kode_plant='${kode}' AND tipe='kasir') AND createdAt LIKE '%${time}%' AND jenis_dokumen='${result.jenis_dokumen}' LIMIT 1`, {
              type: QueryTypes.SELECT
            })
            console.log(cek)
            if (cek.length > 0) {
              const send = { dokumen: result.nama_dokumen, activityId: cek[0].id, path: dokumen, kode_depo: kode, status_dokumen: 1 }
              const upload = await Path.create(send)
              return response(res, 'successfully upload dokumen', { upload })
            } else {
              return response(res, 'failed to upload dokumen', {}, 404, false)
            }
          } else {
            return response(res, 'failed to upload dokumen', {}, 404, false)
          }
        } else if (level === 4) {
          const result = await documents.findByPk(id)
          if (result) {
            const cek = await sequelize.query(`SELECT id from activities WHERE (kode_plant='${kode}' AND tipe='sa') AND createdAt LIKE '%${time}%' AND jenis_dokumen='${result.jenis_dokumen}' LIMIT 1`, {
              type: QueryTypes.SELECT
            })
            if (cek.length > 0) {
              const send = { dokumen: result.nama_dokumen, activityId: cek[0].id, path: dokumen, kode_depo: kode, status_dokumen: 1 }
              const upload = await Path.create(send)
              return response(res, 'successfully upload dokumen', { upload })
            } else {
              return response(res, 'failed to upload dokumen', {}, 404, false)
            }
          } else {
            return response(res, 'failed to upload dokumen', {}, 404, false)
          }
        }
      } catch (error) {
        return response(res, error.message, {}, 500, false)
      }
    })
  },
  editUploadDocument: async (req, res) => {
    const id = req.params.id
    const level = req.user.level
    uploadHelper(req, res, async function (err) {
      try {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE' && req.files.length === 0) {
            console.log(err.code === 'LIMIT_UNEXPECTED_FILE' && req.files.length > 0)
            return response(res, 'fieldname doesnt match', {}, 500, false)
          }
          return response(res, err.message, {}, 500, false)
        } else if (err) {
          return response(res, err.message, {}, 401, false)
        }
        let dokumen = ''
        for (let x = 0; x < req.files.length; x++) {
          const path = `/uploads/${req.files[x].filename}`
          dokumen += path + ', '
          if (x === req.files.length - 1) {
            dokumen = dokumen.slice(0, dokumen.length - 2)
          }
        }
        if (level === 4 || level === 5) {
          const valid = await Path.findByPk(id)
          if (valid) {
            const send = { path: dokumen }
            await valid.update(send)
            return response(res, 'successfully upload dokumen', { send })
          } else {
            return response(res, 'failed to edit upload dokumen', {}, 404, false)
          }
        } else {
          return response(res, "you can't edit dokumen", {}, 404, false)
        }
      } catch (error) {
        return response(res, error.message, {}, 500, false)
      }
    })
  },
  getActivity: async (req, res) => {
    try {
      const level = req.user.level
      const kode = req.user.kode
      //   const time = moment().utc().format('YYYY-MM-DD')
      let { limit, page, search, sort, typeSort } = req.query
      let searchValue = ''
      let sortValue = ''
      let typeSortValue = ''
      if (typeof search === 'object') {
        searchValue = Object.values(search)[0]
      } else {
        searchValue = search || 'daily'
      }
      if (typeof sort === 'object') {
        sortValue = Object.values(sort)[0]
      } else {
        sortValue = sort || 'id'
      }
      if (typeof typeSort === 'object') {
        typeSortValue = Object.values(typeSort)[0]
      } else {
        typeSortValue = typeSort || 'ASC'
      }
      if (!limit) {
        limit = 5
      } else {
        limit = parseInt(limit)
      }
      if (!page) {
        page = 1
      } else {
        page = parseInt(page)
      }
      if (level === 4) {
        const result = await activity.findAndCountAll({
          where: {
            [Op.and]: [
              { kode_plant: kode },
              { tipe: 'sa' }
            ],
            jenis_dokumen: searchValue
          },
          include: [
            {
              model: Path,
              as: 'doc'
            }
          ],
          limit: limit,
          offset: (page - 1) * limit
        })
        const pageInfo = pagination('/dashboard/activity', req.query, page, limit, result.count)
        if (result) {
          return response(res, 'list activity', { result, pageInfo })
        } else {
          return response(res, 'failed to get activity', {}, 404, false)
        }
      } else if (level === 5) {
        const result = await activity.findAndCountAll({
          where: {
            [Op.and]: [
              { kode_plant: kode },
              { tipe: 'kasir' }
            ],
            jenis_dokumen: searchValue
          },
          include: [
            {
              model: Path,
              as: 'doc'
            }
          ],
          order: [[sortValue, typeSortValue]],
          limit: limit,
          offset: (page - 1) * limit
        })
        const pageInfo = pagination('/dashboard/activity', req.query, page, limit, result.count)
        if (result) {
          return response(res, 'list activity', { result, pageInfo })
        } else {
          return response(res, 'failed to get activity', {}, 404, false)
        }
      } else if (level === 1 || level === 2 || level === 3) {
        const result = await activity.findAndCountAll({
          where: {
            jenis_dokumen: searchValue
          },
          include: [
            {
              model: Path,
              as: 'doc'
            }
          ],
          order: [[sortValue, typeSortValue]],
          limit: limit,
          offset: (page - 1) * limit
        })
        const pageInfo = pagination('/dashboard/activity', req.query, page, limit, result.count)
        if (result) {
          return response(res, 'list activity', { result, pageInfo })
        } else {
          return response(res, 'failed to get activity', {}, 404, false)
        }
      }
    } catch (error) {
      return response(res, error.message, {}, 500, false)
    }
  },
  approveDocument: async (req, res) => {
    try {
      const level = req.user.level
      const id = req.params.id
      if (level === 1 || level === 2 || level === 3) {
        const result = await Path.findByPk(id)
        const approve = { status_dokumen: 3 }
        if (result) {
          await result.update(approve)
          return response(res, 'succes approve dokumen', { result })
        } else {
          return response(res, 'failed approve dokumen', {}, 404, false)
        }
      } else {
        return response(res, "you're not super administrator", {}, 404, false)
      }
    } catch (error) {
      return response(res, error.message, {}, 500, false)
    }
  },
  rejectDocument: async (req, res) => {
    try {
      const level = req.user.level
      const id = req.params.id
      const schema = joi.object({
        alasan: joi.string().required()
      })
      const { value: results, error } = schema.validate(req.body)
      if (error) {
        return response(res, 'Error', { error: error.message }, 404, false)
      } else {
        if (level === 1) {
          const result = await Path.findByPk(id)
          const send = {
            alasan: results.alasan,
            status_dokumen: 0
          }
          if (result) {
            await result.update(send)
            return response(res, 'succes reject dokumen', { result })
          } else {
            return response(res, 'failed reject dokumen', {}, 404, false)
          }
        } else {
          return response(res, "you're not super administrator", {}, 404, false)
        }
      }
    } catch (error) {
      return response(res, error.message, {}, 500, false)
    }
  }
}
