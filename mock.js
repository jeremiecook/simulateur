const bodyParser = require('body-parser')
const rp = require('request-promise')
const outils = require('./backend/controllers/outils')
const mapping = require('./backend/lib/openfisca/mapping')

const openfiscaRoot = 'https://openfisca.mes-aides.org'
const buildOpenFiscaRequest = mapping.buildOpenFiscaRequest
function sendToOpenfisca(situation, callback) {
    let request
    try {
        request = buildOpenFiscaRequest(situation)
    } catch(e) {
        return callback({
            message: e.message,
            name: e.name,
            stack: e.stack
        })
    }
    rp({
        uri: `${openfiscaRoot}/calculate`,
        method: 'POST',
        body: request,
        json: true,
    })
    .then(function(result) {
        callback(null, result)
    }).catch(callback)
}

function mock(app) {
  app.use(bodyParser.json())

  let cache
  app.route('/api/outils/communes/:codePostal').get(outils.communes)
  app.post('/api/situations', function(req, res) {
    cache = Object.assign({ _id: 'yolo' }, req.body)
    res.send(cache)
  })

  app.get('/api/situations/:id/openfisca-response', function(req, res, next) {
    sendToOpenfisca(cache, function(err, result) {
      if (err) {
        return next(err)
      }

      res.send(Object.assign({ _id: 'yolo' }, result))
    })
  })

  app.get('/api/openfisca/variables', function(req, res, next) {
    rp({
      uri: `${openfiscaRoot}/variables`,
      json: true
    })
    .then(mapping => res.send(Object.keys(mapping)))
    .catch(error => next(error))
  })

  app.use(function (err, req, res, next) {
    res.status(500).send(err.message || err.error)
    next()
  })

}

module.exports = mock
