'use strict';

var path = require('path');

var route = function route(req, res, next, abe) {
  abe.abeExtend.hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var jsonFile = path.join(__dirname + '/../../partials/json.html')
  var html = abe.coreUtils.file.getContent(jsonFile);
  var json
  var jsonPath
  var error = ''

  if(typeof req.body.jsonPath !== 'undefined' && req.body.jsonPath !== null) {
    try {
      var jsonToSave = JSON.parse(req.body.json)
      abe.cmsOperations.save.saveJson(req.body.jsonPath, jsonToSave)
    } catch(e) {
      error = e
      console.log(e);
    }
  }

  if(typeof req.body.path !== 'undefined' && req.body.path !== null) {
    var pathBody = path.join(abe.config.root, abe.config.draft.url, req.body.path)
    var tplUrl = abe.cmsData.file.fromUrl(pathBody)
    if (!abe.coreUtils.file.exist(tplUrl.json.path)) {
      error = '[ ERROR ] no json found : ' + tplUrl.json.path.replace(abe.config.root, '')
    }else {
      jsonPath = tplUrl.json.path
      json = abe.cmsData.file.get(tplUrl.json.path)
    }
  }

  const site = abe.cmsData.revision.filePathInfos(abe.config.root)
  let allDocs = []

  const drafts = abe.cmsData.file.getFilesByType(path.join(site.path, abe.config.draft.url), 'd')
  const published = abe.cmsData.file.getFilesByType(path.join(site.path, abe.config.publish.url))

  allDocs = allDocs.concat(drafts)
  allDocs = allDocs.concat(published)

  let results = []
  Array.prototype.forEach.call(allDocs, function(file) {
    var jsonPath = abe.cmsData.file.fromUrl(file).json.path
    var json = abe.cmsData.file.get(jsonPath)
    results.push(json)
  })

  var jsonFile = path.join(__dirname + '/../../partials/json.html')
  var html = abe.coreUtils.file.getContent(jsonFile);
  var json
  var error = ''
  var jsonPath

  if(typeof req.query.path !== 'undefined' && req.query.path !== null) {
    var pathQuery = path.join(abe.config.root, abe.config.draft.url, req.query.path)
    var tplUrl = abe.cmsData.file.fromUrl(pathQuery)
    if (!abe.coreUtils.file.exist(tplUrl.json.path)) {
      error = '[ ERROR ] no json found : ' + tplUrl.json.path.replace(abe.config.root, '')
    }else {
      jsonPath = tplUrl.json.path
      json = abe.cmsData.file.get(tplUrl.json.path)
    }
  }

  var template = abe.Handlebars.compile(html, {noEscape: true})
  var tmp = template({
    express: {
      req: req,
      res: res
    },
    jsonPath: jsonPath,
    path: req.body.path,
    json: JSON.stringify(json),
    error: error,
    results: results,
    fileNum: results.length
  })
  
  return res.send(tmp);
}

exports.default = route