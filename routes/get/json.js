'use strict';

var path = require('path');

var route = function route(req, res, next, abe) {
  abe.Hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var site = abe.cmsData.revision.filePathInfos(abe.config.root)
  var files = abe.Manager.instance.getList()

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

  var template = abe.Handlebars.compile(html)
  var tmp = template({
    express: {
      req: req,
      res: res
    },
    path: req.query.path,
    jsonPath: jsonPath,
    json: syntaxHighlight(JSON.stringify(json, null, 2)),
    error: error,
    files: files,
    fileNum: files.length
  })
  
  return res.send(tmp);
}

function syntaxHighlight(json) {
  if (json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'color: darkorange;';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'color: red;';
            } else {
                cls = 'color: green;';
            }
        } else if (/true|false/.test(match)) {
            cls = 'color: blue;';
        } else if (/null/.test(match)) {
            cls = 'color: magenta;';
        }
        return '<span style="' + cls + '">' + match + '</span>';
    });
  } else {
    return ''
  }
}

exports.default = route