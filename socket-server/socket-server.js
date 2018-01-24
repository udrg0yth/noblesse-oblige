var express     =  require('express'),
        bodyParser  =  require('body-parser'),
        app         =  express(),
        genericConstants    =  require('./generic-constants')(),
        uuid = require('node-uuid'),
        globalRoomId = 'root';

        
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended : true
    }));

    require('./cors-filter')(app, genericConstants);


    var http = require('http').createServer(app).listen(8081, function(){
      console.log('Express server listening on port 8081');
    });

    var socketio = require('socket.io')(http);

    var getRoomUsers = function(roomId) {
        return socketio.sockets.adapter.rooms[roomId];
    };

    var getRoomSocketIds = function(roomId) {
        var users = getRoomUsers(roomId);
        var keys = [];
        if(users)
        for(var k in users.sockets){ keys.push(k) };
        return keys;
    }

    var getUsersInfoExcept = function(socketId, roomId) {
        var users = getRoomUsers(roomId);
        var usersInfo = [];
        var keys = [];
        if(users)
        for(var k in users.sockets){ keys.push(k) };
        for(var i=0;i<keys.length;i++) {
            if(keys[i] !== socketId) {
                var userInfo = socketio.sockets.connected[keys[i]].userInfo;
                usersInfo.push({
                    name: userInfo.name,
                    assignedColor: userInfo.assignedColor
                });
            }
        }
        return usersInfo;
    }

    socketio.on('connection', function (socket) {        
        var userInfo = socket.handshake.query;
        var socketRef = socket;
        socketRef.userInfo = userInfo;
        var roomId = userInfo.roomId;
        socketRef.join(roomId);
        if(getRoomSocketIds(roomId).length === 1) {
            userInfo.isMaster = true;
            socketRef.emit('masterAssignEvent', {
                isMaster:true
            });
        } else {
            socketRef.emit('masterAssignEvent', {
                isMaster:false
            });
            userInfo.isMaster = false;
            if(roomId === globalRoomId) {
               // console.log('noobNodeSyncRequestEvent from ', userInfo.name);
                socketRef.broadcast.to(roomId).emit('noobNodeSyncRequestEvent', {socketId: socketRef.id});
            } else {
                socketRef.broadcast.to(roomId).emit('noobArticleSyncRequestEvent', {socketId: socketRef.id});
            }
            console.log(roomId, getUsersInfoExcept(socketRef.id, roomId))
            socketRef.emit('roomiesListEvent' , {
                roomies: getUsersInfoExcept(socketRef.id, roomId)
            });
            //console.log('emit roomies list ', userInfo.name);
            //broadcast this user information to others
            socketRef.broadcast.to(roomId).emit('newArrival', {
                    assignedColor: userInfo.assignedColor,
                    name: userInfo.name
            });
            //console.log('emit new arrival ', userInfo.name);
        }

        socketRef.on('nodeSyncEvent', function(data) {
            var socket = socketio.sockets.connected[data.socketId];
               // console.log('nodeSyncEvent from ', userInfo.name, ' to ', socket.userInfo.name , 'with nodes', data.nodes);
            if(socket) {
                socket.emit('nodeSyncResponseEvent', data.nodes);
            }
        });

        socketRef.on('articleSyncEvent', function(data) {
            var socket = socketio.sockets.connected[data.socketId];
            if(socket) {
                socket.emit('articleSyncResponseEvent', {
                    content: data.content,
                    timestamp: data.timestamp
                });
            }
        });

        socketRef.on('remoteDeltaEvent', function(data) {
            socket.broadcast.to(roomId).emit('remoteDeltaEvent', data);
        });

        socketRef.on('nodeDeletionEvent', function(data) {
            socket.broadcast.to(roomId).emit('nodeDeletionEvent', data);
        });

        socketRef.on('newNodeEvent', function(data) {
            socket.broadcast.to(roomId).emit('newNodeEvent', data);
        });

        socketRef.on('nodeMovedEvent', function(data) {
            socket.broadcast.to(roomId).emit('nodeMovedEvent', data);
        });

        socketRef.on('nodeUpdatedEvent', function(data) {
            socket.broadcast.to(roomId).emit('nodeUpdatedEvent', data);
        });

        socket.on('disconnect', function() {
            console.log(roomId);
            console.log('User disconnected: ', userInfo.name);
            //all sockets in room and in the global room
            var users = getRoomSocketIds(roomId);
            console.log('Current sockets: ', users);
            if(users) {
                //console.log('Sending someone left to', users);
                for(var i=0;i<users.length;i++){ 
                    //console.log('Emitting ', userInfo.name, ' left to ', socketio.sockets.connected[users[i]].userInfo.name);
                    socketio.sockets.connected[users[i]].emit('someoneLeft', {
                        name: userInfo.name
                    });
                };
            }
           // console.log(users, socketRef.userInfo.isMaster);
            if(socketRef.userInfo.isMaster && users.length) {
                //console.log('User who left is master');
                var rand = Math.floor(Math.random() * users.length);
                //console.log('Random: ', rand);
                //console.log('Socket selected id: ', users[rand]);
                var socketMaster = socketio.sockets.connected[users[rand]];
                //console.log('Socket:', socketMaster);
                socketMaster.userInfo.isMaster = true;
                socketMaster.emit('masterAssignEvent', {
                    isMaster: true
                });
            }
        });
    });
