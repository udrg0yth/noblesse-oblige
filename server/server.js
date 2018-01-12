module.exports = function(db, application, genericConstants, tokenHandler) {
  var usersCollection = db.collection('users');
	var nodesCollection = db.collection('nodes');
  var multer  = require('multer')
	var ObjectId = require('mongodb').ObjectID;
	var uuidV4 = require('uuid/v4');
  var CryptoJS = require("crypto-js");
  var fs = require('fs');
  var secretKey = "mbqUNGJuGEqxCqbHsAaYfJrzjnDb6e54nGDQwPt2SHWDv7uEFBVzG8wDPYh5fdAEZFNnTxwkZmvLsVztdPcCRcF86Qt6VPnjbvMt6jeZ6ZJ4WgWSssaz6CH6WMQLp8KL";

  /*var storage = multer.diskStorage({
    destination: function (req, file, cb) {*//*
      fs.existsSync(genericConstants.UPLOAD_DIR_BASE + data.email) || 
      fs.mkdirSync(genericConstants.UPLOAD_DIR_BASE + data.email);
      fs.existsSync(genericConstants.UPLOAD_DIR_BASE + data.email + '/' + data.boardId) || 
      fs.mkdirSync(genericConstants.UPLOAD_DIR_BASE + data.email + '/' + data.boardId);*/
      /*cb(null, genericConstants.LOCAL.UPLOAD_DIR_BASE);
    },
    filename: function (req, file, cb) {
      console.log('in filename');
      var data = req.body;
      var now = Date.now();
      var fileName = uuidV4() + '_' + now;
      var fileDoc = {
        name: fileName,
        uploadedDate: now,
        size: file.size
      };
      db.eval('function(email, boardId, fileDoc){ var document = db.hadronUsers.findOne({email:email}); if(document == null) return; for(var i=0;i<document.boards.length;i++){if(document.boards[i].id === boardId){document.boards[i].files.push(fileDoc); db.hadronUsers.save(document);}}}', [data.email, data.boardId, fileDoc]);
      cb(null, fileName + '.png');
    }
  });*/

  function getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
  }

 /* var upload = multer({ storage: storage });
*/
  function find(parentId, nodes) {
    let result = [];
    if(nodes && nodes.length !== 0)
    for(var i=0;i<nodes.length;i++) {
      if(nodes[i].parentId == parentId) {
        result.push(nodes[i]);
      }
    }
    return result;
  }

 /* application.post(genericConstants.UPLOAD_URL, upload.any(), function (req, res, next) {
    console.log(req.file);
    console.log(req.body);
    console.log('in upload handler');
    res.status(200).json({name: req.files[0].filename});
  });*/

  application.get(genericConstants.GET_NODES, function(req, res) {
     nodesCollection
     .find({}, {fields: {_id : 1, id : 1, name : 1, parentId : 1, creator: 1, creationDate: 1, lastUpdatedBy: 1, lastUpdateDate: 1}})
     .toArray()
     .then(function(documents) {
        var queue = [];
        var nodes = [];
        var root = find(null , documents)[0];
        queue.push(root);
        nodes.push(root);
        while(queue.length !== 0) {
          var currentNode = queue.shift();
          currentNode.children = find(currentNode.id, documents);
          for(var i=0;i<currentNode.children.length;i++) {
            queue.push(currentNode.children[i]);
          }
        }
        res.status(200).json(nodes);
     });
  });

  application.post(genericConstants.SAVE_NODE, function(req, res) {
    var node = req.body;
    var now = new Date();
    if(node._id) {
      node._id = new ObjectId(node._id);
    } else {
      node.creator = req.username;
      node.creationDate = now;
    }
    node.lastUpdateDate = now;
    node.lastUpdatedBy = req.username;
    nodesCollection.save(node, {w:1}, function() {
    });
    return res.status(200).json({});
  });

  application.post(genericConstants.DELETE_NODE, function(req, res) {
    var node = req.body;
    nodesCollection.removeOne({_id: new ObjectId(node._id)}, function(res, err) {
      console.log(res, err);
    });
    return res.status(200).json({});
  });

  application.post(genericConstants.CREATE_ARTICLE, function(req, res) {
    var node = req.body;
    var now = new Date();
    var article = {
      contents: {},
      roomId: uuidV4(),
      creator: req.username,
      creationDate: now,
      lastUpdatedBy: req.username,
      lastUpdateDate: now
    };
    node.article = article;
    nodesCollection.save(node, {w:1}, function() {
    });
    return res.status(200).json({});
  });

  application.post(genericConstants.UPDATE_ARTICLE, function(req, res) {
    var data = req.body;
    var article = {
      contents: data.contents,
      lastUpdatedBy: req.username,
      lastUpdateDate: new Date()
    };
    nodesCollection.updateOne({_id: new ObjectId(data._id)}, 
      {$set: {
        'article.contents': data.contents, 
        'article.lastUpdatedBy': req.username, 
        'article.lastUpdateDate': new Date()}});
    return res.status(200).json({});
  });

  application.get(genericConstants.LOGIN_URL, function(req, res) {
    var buffer = new Buffer(req.headers['authorization'], 'Base64');
    var authorization = buffer
          .toString();

    var randomColor = getRandomColor();

    if(!(authorization.split(':').length === 2)) {
      return res.status(401).json({message: 'WRONG_AUTHORIZATION_HEADERS'});
    }

    var username = authorization.split(':')[0];
    var password = authorization.split(':')[1];
    
    usersCollection
    .findOne({username: username}, {fields: {username: 1, password: 1}})
    .then(function(document) {

        var bytes  = CryptoJS.AES.decrypt(document.password, secretKey);
        var plaintext = bytes.toString(CryptoJS.enc.Utf8);

        if(!document || plaintext !== password) {
          return res.status(401).json({message: 'WRONG_CREDENTIALS'});
        }

        res.setHeader('x-auth-token', tokenHandler.generateToken({username: username, assignedUserColor: randomColor}));
        res.setHeader('Content-Type', 'application/json');
        res.json({});
    })
    .catch(function(err) {
      res.status(500).json({message: err.message});
    });

  });

  application.get(genericConstants.CHECK_AUTHENTICATION, function(req, res) {
    return res.status(200).json({});
  });

  application.post('/encrypt', function(req, res) {
    var data = req.body;
    return res.status(200).json({'encText': CryptoJS.AES.encrypt(data.text, secretKey).toString()});
  });

};