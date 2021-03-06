'use strict';

var path = require('path');

var route = function route(req, res, next, abe) {
  abe.abeExtend.hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var htmlToSend = '';
  var request = '{{abe type="data" key="results" source="' + req.body.select + '"}}';
  var json = req.body.json
  if(typeof json !== 'undefined' && json !== null
    && json !== '') {
    json = JSON.parse(json)
  }else {
    json = {}
  }

  var dateStart = new Date()
  abe.cmsData.sql.executeQuery(req.body.path, request, json)
    .then((result) => {
      var d = (new Date().getTime() - dateStart.getTime()) / 1000

      var data = path.join(__dirname + '/../../partials/data.html')
      var html = abe.coreUtils.file.getContent(data);
      var template = abe.Handlebars.compile(html, {noEscape: true})
      var tmp = template({
        express: {
          req: req,
          res: res
        },
        select: req.body.select,
        path: req.body.path,
        json: req.body.json,
        result: result,
        size: result.length,
        request: request,
        duration: d
      })
      
      return res.send(tmp);
    })
}

exports.default = route