// connexion fichier server
var socket = io.connect('http://localhost:8080');


// On recup le pseudo
while(!pseudo) {
    var pseudo = prompt('quel est ton nom ?');
}
socket.emit('pseudo', pseudo);
socket.emit('oldWhispers', pseudo);
document.title = pseudo + ' - ' + document.title;

// Les commandes
document.getElementById('chatForm').addEventListener('submit', (e)=>{

    e.preventDefault();
    const textInput = document.getElementById('msgInput').value;
    const mytext = textInput.split(' ');

    if(mytext[0] == '/list'){
        console.log('lolo')
        socket.emit('command', mytext);
        createElementFunction('command', mytext);
    }
    
    if(mytext == '/users'){

        socket.emit('commanduser', mytext);
        
        createElementFunction('commanduser', mytext);
    }
    if(mytext == '/create'){

        socket.emit('commandcreate', mytext);
        
        createElementFunction('commandcreate', mytext);
    }
    if(mytext == '/delete'){

        socket.emit('commandDelete', mytext);
        
        createElementFunction('commandDelete', mytext);
    }
    if(mytext == '/quit'){

        socket.emit('quitUser', pseudo);
        
        createElementFunction('quitUser', pseudo);
    }

});

// Quand on écrit un message normal
document.getElementById('chatForm').addEventListener('submit', (e)=>{

    e.preventDefault();
    const textInput = document.getElementById('msgInput').value;
    document.getElementById('msgInput').value = '';

    // On récup le receveir du message
    const receiver = document.getElementById('receiverInput').value;
    if(textInput.length > 0) {

        socket.emit('newMessage', textInput, receiver);

        if(receiver === "all") {
            createElementFunction('newMessageMe', textInput);
        }
       
    } 
    else {
        return false;
    }

});


// Définition pour les switch case
socket.on('newUser', (pseudo) => {
    createElementFunction('newUser', pseudo);
});
socket.on('oldWhispers', (messages) => {
    messages.forEach(message => {
        createElementFunction('oldWhispers', message);
    });
})
socket.on('newUserInDb', (pseudo) => {
    newOption = document.createElement('option');
    newOption.textContent = pseudo;
    newOption.value = pseudo;
    document.getElementById('receiverInput').appendChild(newOption);
})

//si le user se déconnecte
socket.on('quitUser', (message) => {
    createElementFunction('quitUser', message);
});


socket.on('newMessageAll', (content) => {
    createElementFunction('newMessageAll', content);
});

socket.on('command', (content) => {
        createElementFunction('command', content);
});
socket.on('commanduser', (content) => {
    createElementFunction('commanduser', content);
});
socket.on('commandcreate', (content) => {
    createElementFunction('commandcreate', content);
});
socket.on('commandDelete', (content) => {
    createElementFunction('commandDelete', content);
});


// les message privé
socket.on('whisper', (content) => {
    createElementFunction('whisper', content);
});

socket.on('commandWhisper', (content) => {
    createElementFunction('commandWhisper', content);
});

// On attend que le user change de channel
socket.on('emitChannel', (channel) => {
    if(channel.previousChannel) {    
        document.getElementById(channel.previousChannel).classList.remove('inChannel')
    }
    document.getElementById(channel.newChannel).classList.add('inChannel')
});

// Nouveau channel
socket.on('newChannel', (newChannel) => {
    createChannel(newChannel)
});

// Tous les anciens messages 
socket.on('oldMessages', (messages, user) => {
    messages.forEach(message => {
        if(message.sender === user) {
            createElementFunction('oldMessagesMe', {sender: message.sender, content: message.content});
        } else {
            createElementFunction('oldMessages', {sender: message.sender, content: message.content});
        }
    });
});

//pour créer un channel
function createChannel(newRoom) {

    const newRoomItem = document.createElement("li");
    newRoomItem.classList.add('elementList');
    newRoomItem.id = newRoom;
    newRoomItem.textContent = newRoom;
    newRoomItem.setAttribute('onclick', "_joinRoom('" + newRoom + "')")
    document.getElementById('roomList').insertBefore(newRoomItem, document.getElementById('createNewRoom'));

}
// Pour supprimer u n channel
function deleteChannel (channel) {
    deleteOne(channel);
};


function _joinRoom(channel){
  
    document.getElementById('msgContainer').innerHTML = "";
    socket.emit('changeChannel', channel);  
}


// Creer un nouveau channel
function _createRoom(){
    while(!newRoom){
        var newRoom = prompt('Quel est le nom de la nouvelle Room ?');
    }
    _joinRoom(newRoom);
    createChannel(newRoom);
   
}


// Switch pour le commandes + Messages
function createElementFunction(element, content) {
    
    const newElement = document.createElement("div");

    switch(element){

        case 'newMessageMe':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = pseudo + ': ' + content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;
            
            
        case 'newMessageAll':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = content.pseudo + ': ' + content.message;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'command':
                document.getElementById('channellist').className = "visibility";
                break;
           
        case 'commanduser':
             document.getElementById('userlist').className = "visibility";
                break;

        case 'commandcreate':
            _createRoom();
             break;  

        case 'commandDelete':
            console.log('demerde');
            deleteChannel();
            break;

        case 'whisper':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' vous chuchote: ' + content.message;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

         case 'commandWhisper':
                newElement.classList.add(element, 'message');
                newElement.textContent = content.sender + ' vous chuchote: ' + content.message;
                document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newUser':
            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' a rejoint le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'quitUser':
            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' a quitté le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldMessages':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = content.sender + ': ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldMessagesMe':
            newElement.classList.add('newMessageMe', 'message');
            newElement.innerHTML = content.sender + ': ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
        break;

        case 'oldWhispers':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' vous chuchote: ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

    }
}