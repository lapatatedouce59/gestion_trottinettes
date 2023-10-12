const {WebSocket, WebSocketServer} = require('ws');
const {v4} = require('uuid')
const https = require('https')

const wss = new WebSocket.Server({ port: 8081 });

const clients = {}

/*
console.log('├ Creating securised server...')
const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/privkey.pem')
})

logUpdate('├ Defining socket...')
const wss = new WebSocketServer({server});

logUpdate('├ Starting server listening...')
server.listen(8081)
*/

wss.on('connection', (ws, req) => {
    let newUUID;
    logger.client(true)
    let clientIp=req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    newUUID = v4();

    ws.on('message', msg => {
        let data = false;
        let op = 0;
        try{
            data = JSON.parse(msg);
            if(!(data.op)) return;
            op = data.op;
        } catch (error) {
            logger.error(error)
        }
        

        if(op==='300') return;
        
        /*worker1.postMessage("MAJ");
        ('sent to worker')
        worker1.on('message', ()=>{
            work=true
        })*/
        switch(op){
            case 1:
                break;
        }
    })
})