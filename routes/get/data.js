'use strict';

var path = require('path');

var route = function route(req, res, next, abe) {
  abe.abeExtend.hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var htmlToSend = '';

  var login = path.join(__dirname + '/../../partials/data.html')
  var html = abe.coreUtils.file.getContent(login);

  var template = abe.Handlebars.compile(html, {noEscape: true})
  var tmp = template({
    express: {
      req: req,
      res: res
    }
  })
  
  return res.send(tmp);
}

exports.default = route