'use strict';

var path = require('path');

var route = function route(req, res, next, abe) {
  abe.Hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var jsonFile = path.join(__dirname + '/../../partials/json.html')
  var html = abe.fileUtils.getFileContent(jsonFile);
  var json
  var jsonPath
  var error = ''

  if(typeof req.body.jsonPath !== 'undefined' && req.body.jsonPath !== null) {
    try {
      var jsonToSave = JSON.parse(req.body.json)
      abe.saveJson(req.body.jsonPath, jsonToSave)
    } catch(e) {
      error = e
      console.log(e);
    }
  }

  if(typeof req.body.path !== 'undefined' && req.body.path !== null) {
    var pathBody = path.join(abe.config.root, abe.config.draft.url, req.body.path)
    var tplUrl = abe.FileParser.getFileDataFromUrl(pathBody)
    if (!abe.fileUtils.isFile(tplUrl.json.path)) {
      error = '[ ERROR ] no json found : ' + tplUrl.json.path.replace(abe.config.root, '')
    }else {
      jsonPath = tplUrl.json.path
      json = abe.FileParser.getJson(tplUrl.json.path)
    }
  }

  var site = abe.folderUtils.folderInfos(abe.config.root)
  var allDraft = []
  var allPublished = []

  let draft = abe.config.draft.url
  let publish = abe.config.publish.url

  var drafted = abe.FileParser.getFilesByType(path.join(site.path, draft), 'd')
  var published = abe.FileParser.getFilesByType(path.join(site.path, publish))

  drafted = drafted.concat(published)

  var results = []
  Array.prototype.forEach.call(drafted, function(file) {
    var jsonPath = abe.FileParser.getFileDataFromUrl(file.path).json.path
    var json = abe.FileParser.getJson(jsonPath)
    results.push(json)
  })

  var jsonFile = path.join(__dirname + '/../../partials/json.html')
  var html = abe.fileUtils.getFileContent(jsonFile);
  var json
  var error = ''
  var jsonPath

  if(typeof req.query.path !== 'undefined' && req.query.path !== null) {
    var pathQuery = path.join(abe.config.root, abe.config.draft.url, req.query.path)
    var tplUrl = abe.FileParser.getFileDataFromUrl(pathQuery)
    if (!abe.fileUtils.isFile(tplUrl.json.path)) {
      error = '[ ERROR ] no json found : ' + tplUrl.json.path.replace(abe.config.root, '')
    }else {
      jsonPath = tplUrl.json.path
      json = abe.FileParser.getJson(tplUrl.json.path)
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