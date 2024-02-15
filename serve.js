const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

const { createClient } = require('redis');

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

client.connect();

client.set('key', 'value');

client.hSet('user-session:123', {
    name: 'John',
    surname: 'Smith',
    company: 'Redis',
    age: 29
})

let userSession = client.hGetAll('user-session:123');
console.log(JSON.stringify(userSession, null, 2));

let user;
let room

const server = http.createServer((reqiuest, respons) => { 
    const url = reqiuest.url;

    // Типо роутер - Домашная, страница чата, Возврат файла
    switch (0) {
        case url.indexOf('/home'):
            respons.end(fs.readFileSync('./index.html'));
            break;
        case url.indexOf('/chat'):
            respons.writeHead(200, {'content-type': 'text/html'});

            // Крутим тело отправки авторизационных данных
            reqiuest.on('data', async (chunk) =>  {
                let json = await chunk.toString('utf-8');
                const roomnumber = json.slice(json.indexOf('numberchat') + 13).replace('"}', '');
                room = roomnumber;
                const nameuser = json.slice(json.indexOf('username') + 11, json.indexOf(',')).replace('"', '');
                user = nameuser;

                console.log('room', room, 'user', user)
            });


            fs.createReadStream('mychat.html').pipe(respons);
            break;
        default:
            respons.end(fs.readFileSync('.' + reqiuest.url));
            break;
    }

});

const io = new Server(server)

// Конект пользователя
io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    // Подписываемся на номер комнаты
    socket.join(room)

    // Отправка статуса при авторизации
    io.to(room).emit('user autorize', user);

    // прием сообщения от ui клиента
    socket.on('chat message', (msg) => {
        // Отправка сообщения всем клиентам ui 
        io.to(room).emit('new message', msg);
    });

    // При отключении отправка статуса
    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.emit('disconected', socket.id);
        console.log(socket.handshake.address)
      });
})

server.listen(8000, '192.168.56.1');
