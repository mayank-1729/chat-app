var express = require('express'),
    app =  express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

    users = {};

var PORT = process.env.PORT || 3000;
    server.listen(PORT);

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get('/', function(req, res){
    res.render('index')
});

//On new connection
io.sockets.on('connection', function(socket){
    console.log('Event: connection =>'+'new connection established.....')

    socket.on('new user', function(data, callback){
        console.log('Event: new user =>'+ data);
        if(data in users){
            console.log('Sorry! Nickname has been already taken');
            callback(false)
        }else{
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket
            updateNicknames();
        }
    });

    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
    };

    socket.on('send message', function(data, callback){
        console.log('Event: send message =>'+ data);
        var msgStr = data.trim();

        if(msgStr.substr(0,1) == '@'){ //it is a private message
            console.log(msgStr)
            msgStr=msgStr.substr(1);
            var ind=msgStr.indexOf(' ');
            console.log(msgStr)
            if( ind !== -1){
                var name = msgStr.substr(0,ind);
                var msg = msgStr.substr(ind+1)
                if(name in users){
                    console.log('its a private message.')
                    users[name].emit('whisper', {msg: msg, nick:socket.nickname})
                    socket.emit('private', {msg: msg, nick: name})
                }else{
                    console.log('user does not exist');
                    callback('User has left the chat room or did not joined the chat room.')    
                }
            }else{
                console.log('Message body is empty');
                callback('Looks like you forgot to write the message.')
            }
        }else{ //it is a public message
            io.sockets.emit('new message', {msg: msgStr, nick: socket.nickname});
        }
        
    });

    socket.on('disconnect', function(data){
        console.log('Event: send message =>', data);
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    })
});


