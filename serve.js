const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

let userRooms = [];
let messageAll = {};
let numberchat;
let nameuser;
let legal = false;

// Проверяем в массиве, есть ли записанный юзер или комната
const chunkingArr = (room=null, user=null) => {
    let acsses = false;
    userRooms.forEach((elem) => {
       if( elem.rootnumber == room || elem.nameuser == user){ 
        acsses = true;
       }
    });

    return acsses;
}

// Добавляем комнату, юзера и массив из даты и сообщения
const pushMessage = (user, room, msg) => {
    if(messageAll[room]){
        messageAll[room].push(user);
        messageAll[room].push(new Date().getTime());
        messageAll[room].push(msg); 
    } else{
        messageAll[room] = [];
        messageAll[room].push(user);
        messageAll[room].push(new Date().getTime());
        messageAll[room].push(msg);
    }
    return true;
}

// Проверяем объект полных сообщений, выдаем список юзеров и их сообщений в определенной комнате
const pullMessage = (rooms) => {
    if(messageAll[rooms]){
        return messageAll[rooms];
    } else {
        return false;
    }
}


const server = http.createServer((reqiuest, respons) => { 
    const url = reqiuest.url;

    // Типо роутер - Домашная, страница чата, Возврат файла
    switch (reqiuest.method) {
        case 'POST':
            reqiuest.on('data', async (chunk) =>  {
                let json = await chunk.toString('utf-8');
                let jsons = JSON.parse(json);
                numberchat = jsons.numberchat;
                nameuser = jsons.username;
                userRooms.push({"nameuser": nameuser, "rootnumber" : numberchat});
            });
            legal = true;
            fs.createReadStream('mychat.html').pipe(respons);
            break;
    
            case 'GET':
                if(reqiuest.url == '/home'){
                    fs.createReadStream('index.html').pipe(respons);
                } else if (reqiuest.url.indexOf('es:') > 0 || 
                            reqiuest.url.indexOf('con.') > 0){
                                
                    fs.createReadStream("./" + reqiuest.url.slice(7)).pipe(respons);
                    
                } else if (reqiuest.url.indexOf('at:') > 0 && legal){
                    fs.createReadStream('mychat.html').pipe(respons);
                    legal = false;
                
                }
                else if(chunkingArr(reqiuest.url.slice(6))){
                     fs.createReadStream('mychat.html').pipe(respons);
                }
                else {
                    fs.createReadStream('err.html').pipe(respons);
                };
                break;
        default:
            break;
    }

});

const io = new Server(server)

// Конект пользователя
io.on('connection', (socket) => {
    // Подписываемся на номер комнаты
    socket.join(numberchat);

    socket.on('who user', (local) => {
        nameuser = local.names;
        numberchat = local.room;

        socket.emit('prev_message', pullMessage(local.room));

    });

    // Отправка статуса при авторизации
    io.to(numberchat).emit('user autorize', nameuser);
    

    // прием сообщения от ui клиента
    socket.on('chat message', (msg) => {
        // Отправка сообщения всем клиентам ui 
        if(chunkingArr(msg.room) && chunkingArr(null, msg.names)) {
            pushMessage(msg.names, msg.room, msg.msg);
            // console.log(messageAll);
            io.emit('new message', msg);
        }
    });

    // При отключении отправка статуса
    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.emit('disconected', socket.id);
      });
})

server.listen(8000, '192.168.56.1');
