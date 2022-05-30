var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

//connection BDD
mongoose.connect('mongodb+srv://elisa:mdp@irc.su7or.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, function(err){
if(err) {
    console.log(err)
} else {
    console.log('Connected to mongodb')
}
})

//les models BDD
require('./models/user.model');
require('./models/chat.model');
require('./models/room.model');
var User = mongoose.model('user');
var Chat = mongoose.model('chat');
var Room = mongoose.model('room');

app.use(express.static(__dirname + '/public'));

//ROUTER
app.get('/', function(req, res) {
    User.find((err, users) => {
        if(users) { 
            Room.find((err, channels) => {
                if(channels){
                    res.render('index.ejs', {users: users, channels: channels});
                }
                else {

                    res.render('index.ejs', {users: users});
                }
            });
        } else {
            Room.find((err, channels) => {
                if(channels){
                    res.render('index.ejs', {channels: channels});
                }
                else {

                    res.render('index.ejs');
                }
            });
        }
    });
});

//Variables d'environnement
server.listen(8080, () => console.log('Server started at port : 8080'));

// IO socket
var io = require('socket.io').listen(server);
var connectedUsers = []

io.on('connection', (socket) => {
    
    // On recoit le pseudo
    socket.on('pseudo', (pseudo) => {
        
        User.findOne({ pseudo: pseudo }, (err, user) => {
            if(user) {

                // On join le channel commun
                _joinRoom("salon1");
                socket.pseudo = pseudo;
                connectedUsers.push(socket);
                // message alerte pour les autre user
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);

            } else {
                var user = new User();
                user.pseudo = pseudo;
                user.save();
                _joinRoom("salon1");

                socket.pseudo = pseudo;
                connectedUsers.push(socket)
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);
                socket.broadcast.emit('newUserInDb', pseudo);
            }
        })

    });

    //Pour les anciens messages
    socket.on('oldWhispers', (pseudo) => {
        Chat.find({ receiver: pseudo }, (err, messages) => {

            if(err) {
                return false;
            } else {
                socket.emit('oldWhispers', messages)
            }

        }).limit(5);
    });

    socket.on('changeChannel', (channel) => {
        _joinRoom(channel);
    });

    //Pour les nouveaux messages
    socket.on('newMessage', (message, receiver)=> {

        if(receiver === "all") { 

            var chat = new Chat();
            chat._id_room = socket.channel;
            chat.sender = socket.pseudo;
            chat.receiver = receiver;
            chat.content = message;
            chat.save();

            socket.broadcast.to(socket.channel).emit('newMessageAll', {message: message, pseudo: socket.pseudo});
           
        }
         else {

            User.findOne({pseudo: receiver}, (err, user) => {
                if(!user) {
                    return false
                } else {
                    
                    socketReceiver = connectedUsers.find(element => element.pseudo === user.pseudo)

                    if(socketReceiver) {
                        socketReceiver.emit('whisper', { sender: socket.pseudo, message: message })
                    }

                    var chat = new Chat();
                    chat.sender = socket.pseudo;
                    chat.receiver = receiver;
                    chat.content = message;
                    chat.save();

                }
            })

        }
  

    });

    // Quand un user se deconnecte
    socket.on('disconnect', () => {
        var index = connectedUsers.indexOf(socket)
        if(index > -1) {
            connectedUsers.splice(index, 1)
        }
        socket.broadcast.to(socket.channel).emit('quitUser', socket.pseudo);
    });


    function _joinRoom(channelParam) {

        //Si l'utilisateur est déjà dans un channel
        var previousChannel = ''
        if(socket.channel) {
            previousChannel = socket.channel; 
        }

        //On quitte tous les channels et on rejoint le channel qu'n veux
        socket.leaveAll();
        socket.join(channelParam);
        socket.channel = channelParam;

        Room.findOne({name: socket.channel}, (err, channel) => {
            if(channel){
                Chat.find({_id_room: socket.channel}, (err, messages) => {
                    if(!messages){
                        return false;
                    }
                    else{
                        socket.emit('oldMessages', messages, socket.pseudo);
                        //Si l'utilisateur d'un autre channel, sinon on ne fait passer le nouveau
                        if(previousChannel) {
                            socket.emit('emitChannel', {previousChannel: previousChannel, newChannel: socket.channel});
                        } else {
                            socket.emit('emitChannel', {newChannel: socket.channel});
                        }
                    }
                });
            }
            else {
                var room = new Room();
                room.name = socket.channel;
                room.save();
                
                socket.broadcast.emit('newChannel', socket.channel);
                socket.emit('emitChannel', {previousChannel: previousChannel, newChannel: socket.channel});
            }
        })
    }

});