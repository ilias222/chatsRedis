const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

let userRooms = [];
let messageAll = {};
let numberchat;
let nameuser;
let legal = false;
let list = [];

// Проверяем в массиве, есть ли записанный юзер или комната
const chunkingArr = (room=null, user=null) => {
    let acsses = false;
    userRooms.forEach((elem) => {
       if(elem.rootnumber == room || elem.nameuser == user){ 
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

const pullUser = (nameuser, id) => {

    console.log('length arr list', list.length)

    if(list.length > 0 && list.find((elem) => elem.nameuser == nameuser)){

        console.log('searsh user in list');

    } else{
        console.log('push user')
        list.push({"nameuser" : nameuser, "id" : id});
    }

    console.log(list)

    return list;
};


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

    socket.on('who user', async (local) => {
        nameuser = await local.names;
        numberchat = await local.room;

        socket.join(numberchat);
        [id , room] = socket.rooms;

        // Перебираем масив Юзер - номер комнаты
        io.to(room).emit('user autorize', pullUser(nameuser, socket.id));

        io.to(room).emit('prev_message', pullMessage(room));
    });




    // прием сообщения от ui клиента
    socket.on('chat message', (msg) => {

        // Отправка сообщения всем клиентам комнаты
        if(chunkingArr(msg.rooms) && chunkingArr(null, msg.names)) {

            nameuser = msg.names;
            numberchat = msg.room;
            
            socket.join(numberchat);
            [id , room] = socket.rooms;

            pushMessage(msg.names, msg.rooms, msg.msg);

            io.to(room).emit('new message', msg);
        }
    });

    // При отключении отправка статуса

    socket.on('disconnect', (e) => {

        socket.disconnect(true);

        io.emit('discon', e); 

        io.emit('delete user', socket.id);
      });
});

server.listen(8000, '192.168.56.1');
