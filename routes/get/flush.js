'use strict';

var path = require('path');

function sortByDate(a, b) {
  var dateA = new Date(a.json.abe_meta.latest.date)
  var dateB = new Date(b.json.abe_meta.latest.date)
  if(dateA > dateB) {
    return 1
  }else if(dateA < dateB) {
    return -1
  }
  return 0
}

var route = function route(req, res, next, abe) {
  abe.Hooks.instance.trigger('beforeRoute', req, res, next);
  if(typeof res._header !== 'undefined' && res._header !== null) return;

  var flush = false
  if(typeof req.query.flush !== 'undefined' && req.query.flush !== null) {
    flush = true
  }

  var htmlToSend = '';

  var site = abe.cmsData.revision.filePathInfos(abe.config.root)
  var allDraft = []
  var allPublished = []

  let draft = abe.config.draft.url
  let publish = abe.config.publish.url

  var drafted = abe.cmsData.file.getFilesByType(path.join(site.path, draft), 'd')

  var results = {}

  Array.prototype.forEach.call(drafted, function(file) {
    var jsonPath = abe.cmsData.file.fromUrl(file.path).json.path
    if (abe.coreUtils.file.exist(jsonPath)) {
      var json = abe.cmsData.file.get(jsonPath)
      if(typeof results[json.abe_meta.link] === 'undefined' || results[json.abe_meta.link] === null) {
        results[json.abe_meta.link] = []
      }
      results[json.abe_meta.link].push({
        path:jsonPath,
        json:json
      })
    }
  })

  var successCopy = 0
  var finalResults = []
  var numbOfFiles = 0
  var countRemoveDraft = 0
  var toRemove = []
  var errors = []
  Array.prototype.forEach.call(Object.keys(results), (res) => {
    var publish_found = false

    var arraySorted = results[res]
    arraySorted.sort(sortByDate)
    // remove draft
    var arrayStatus = []
    Array.prototype.forEach.call(arraySorted, (r) => {
      numbOfFiles++
      if (r.json.abe_meta.status === 'publish') {
        publish_found = true
      }

      if (!publish_found && r.json.abe_meta.status !== 'publish') {
        r.willRemove = true
        countRemoveDraft++
      }else {
        if(typeof arrayStatus[r.json.abe_meta.status] !== 'undefined' && arrayStatus[r.json.abe_meta.status] !== null) {
          arrayStatus[r.json.abe_meta.status]++
        }else {
          arrayStatus[r.json.abe_meta.status] = 0
        }
        r.willRemove = false
      }
    })

    if (!publish_found) {
      countRemoveDraft--
      arraySorted[arraySorted.length-1].willRemove = false
    }

    // remove other status
    Array.prototype.forEach.call(arraySorted, (r) => {
      if (!r.willRemove && arrayStatus[r.json.abe_meta.status] > 0 && r.json.abe_meta.status !== 'publish') {
        arrayStatus[r.json.abe_meta.status]--
        r.willRemove = true
      }
    })

    Array.prototype.forEach.call(arraySorted, (r) => {
      var hasBeenRemove = false
      var status = (r.json.abe_meta.status === 'publish') ? r.json.abe_meta.status : 'draft'
      if (flush && r.willRemove && status !== 'publish') {
        var folder = abe.config.draft.url
        var draftUrl = path.join(folder, r.json.abe_meta.latest.abeUrl)
        var fileToRemove = abe.cmsData.file.fromUrl(draftUrl)
        
        if (!abe.coreUtils.file.exist(fileToRemove.json.path)) {
          errors.push({
            path: fileToRemove.json.path,
            msg: fileToRemove.json.path + " doesn't exist <br /> <br />Draft:" + draftUrl + " <br /> <br />status:" + status
          })
        }else {
          try {
            abe.fse.copySync(fileToRemove.json.path, fileToRemove.json.path.replace('/' + abe.config.data.url + '/', '/backup_ABE/'+abe.config.data.url + '/'))
            abe.fse.removeSync(fileToRemove.json.path)
            successCopy++
            hasBeenRemove = true
          } catch (err) {
            errors.push({
              path: fileToRemove.json.path,
              msg: err
            })
          }
        }
        if (!abe.coreUtils.file.exist(fileToRemove[status].path)) {
          errors.push({
            path: fileToRemove[status].path,
            msg: fileToRemove[status].path + " doesn't exist <br /> <br />Draft:" + draftUrl + " <br /> <br />status:" + status
          })
        }else {
          try {
            abe.fse.copySync(fileToRemove[status].path, fileToRemove[status].path.replace('/' + folder + '/', '/backup_ABE/'+folder+'/'))
            abe.fse.removeSync(fileToRemove[status].path)
            successCopy++
            hasBeenRemove = true
          } catch (err) {
            errors.push({
              path: fileToRemove[status].path,
              msg: err
            })
          }
        }
        
        if (!hasBeenRemove) {
          toRemove.push({
            html: fileToRemove.json.path,
            json: fileToRemove[status].path
          })
        }
      }
      if (!hasBeenRemove) {
        finalResults.push({
          link: res,
          path: r.path,
          cleanPath: r.path.replace(abe.config.root, '').replace(abe.config.data.url, ''),
          status: r.json.abe_meta.status,
          json: r.json,
          willRemove: r.willRemove,
          date: abe.moment(r.json.abe_meta.latest.date).format('MMMM Do YYYY, h:mm:ss a'),
          template: r.json.abe_meta.template,
          errors: errors
        })
      }
    })
  })
  // console.log('* * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
  // console.log('toRemove', toRemove)

  var flush = path.join(__dirname + '/../../partials/flush.html')
  var html = abe.coreUtils.file.getContent(flush);

  var template = abe.Handlebars.compile(html, {noEscape: true})
  var tmp = template({
    express: {
      req: req,
      res: res
    },
    results:finalResults,
    totalToRemove:countRemoveDraft*2,
    numbOfFiles:numbOfFiles*2,
    successCopy:successCopy,
    errors:errors
  })
  
  return res.send(tmp);
}

exports.default = route