const {WebSocket, WebSocketServer} = require('ws');
const {v4} = require('uuid')
const https = require('https')
const {setTimeout} = require('timers/promises')
const fs = require('fs')

const wss = new WebSocket.Server({ port: 8083 });

const clients = {}
let api = require('./api.json')
const logger = require('./tools/logger')


wss.broadcast = function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
};

function save(mode){
    fs.writeFileSync('./api.json', JSON.stringify(api, null, 2));
    if(mode===true){
        wss.broadcast(JSON.stringify({
            op: 3,
            content: api
        }))
    }
}

let uuidList = []


/*
console.log('├ Creating securised server...')
const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/privkey.pem')
})

logUpdate('├ Defining socket...')
const wss = new WebSocketServer({server});

logUpdate('├ Starting server listening...')
server.listen(8083)
*/

function verification(uuid){
    if(uuidList.includes(uuid)) return true;
    return false;
}

let authProc='free'
let authPlace=false

function availableParks(){
    let places = []
    for(let place of api.places){
        if (place.state==='free') places.push(place.id)
    }
    return places.length;
}

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

        if(op===3) return;
        
        /*worker1.postMessage("MAJ");
        ('sent to worker')
        worker1.on('message', ()=>{
            work=true
        })*/
        switch(op){
            case 1:
                ws.ip=clientIp
                ws.uuid=newUUID
                ws.send(JSON.stringify({ op: 2, uuid: newUUID, content: api }))
                uuidList.push(newUUID)
                break;
            case 4:
                if(!(verification(data.uuid))) {
                    ws.send(JSON.stringify({ op: 900, code: 403, message: 'Auth error.' }))
                }
                if(data.cmd==='CAPT-STATE'){
                    for(let place of api.places){
                        console.log(place.id +' et '+data.args.id)
                        if(!(place.id===data.args.id)) continue;
                        place.capt=data.args.state
                        if(data.args.state===false){
                            if(authProc==='waitingForRemove'){
                                if(authPlace===place.id){
                                    authPlace=false
                                    authProc='free'
                                    place.owner=''
                                    place.state='free'
                                    const wait = async ()=>{
                                        api.screen.screenContentl1=''
                                        api.screen.screenContentl2='Goodbye!'
                                        api.screen.screenContentl3=''
                                        api.screen.screenContentl4=''
                                        api.screen.screenContentl5='Goodbye!'
                                        api.screen.screenContentl6=''
                                        api.screen.mode='n'
                                        save(true)
                                        await setTimeout(3000)
                                        api.screen.screenContentl1='Welcome to'
                                        api.screen.screenContentl2='the parking!'
                                        api.screen.screenContentl3=''
                                        api.screen.screenContentl4='Available:'
                                        api.screen.screenContentl5=`-> ${availableParks()}`
                                        api.screen.screenContentl6=''
                                        api.screen.delay=4000
                                        api.screen.mode='d'
                                        authProc==='free'
                                        return save(true)
                                    }
                                    wait()
                                }
                            } else if (place.state==='took'){
                                place.capt=!data.args.state
                                return save(true)
                            }
                        } else
                        if(data.args.state===true){
                            if(authProc==='waitingForCapt'){
                                if(place.state==='pending'){
                                    place.state='took'
                                    api.screen.screenContentl1='Welcome to'
                                    api.screen.screenContentl2='the parking!'
                                    api.screen.screenContentl3=''
                                    api.screen.screenContentl4='Available:'
                                    api.screen.screenContentl5=`-> ${availableParks()}`
                                    api.screen.screenContentl6=''
                                    api.screen.delay=4000
                                    api.screen.mode='d'
                                    authProc='free'
                                    save(true)
                                    break;
                                } else {
                                    api.screen.screenContentl1='Please remove'
                                    api.screen.screenContentl2='the scooter and'
                                    api.screen.screenContentl3='put it in the'
                                    api.screen.screenContentl4='place that is'
                                    api.screen.screenContentl5='blinking.'
                                    api.screen.screenContentl6=`Place ${authPlace}`
                                    api.screen.delay=2000
                                    api.screen.mode='d'
                                    save(true)
                                    break;
                                }
                            } else {
                                let autoReset = async ()=>{
                                    api.screen.screenContentl1='Please remove'
                                    api.screen.screenContentl2='the scooter and'
                                    api.screen.screenContentl3='identify.'
                                    api.screen.screenContentl4='Please remove'
                                    api.screen.screenContentl5='the scooter and'
                                    api.screen.screenContentl6='identify.'
                                    api.screen.mode='n'
                                    save(true)
                                }
                                autoReset()
                                break;
                            }
                        }
                    }
                }
                if(data.cmd==='IDENTIFY'){
                    let userVerified=[]
                    for(let user of api.users){
                        userVerified.push(user)
                        if((data.args.name===user.nm)&&(data.args.pwd===user.pass)){
                            console.log('AUTHED')
                            let owned=false
                            for(let place of api.places){
                                if(place.owner===user.nm) {
                                    owned=true
                                    authPlace=place.id
                                }
                            }
                            console.log(owned)
                            if(owned){
                                authProc='waitingForRemove'
                                api.screen.screenContentl1='Take your'
                                api.screen.screenContentl2='scooter at'
                                api.screen.screenContentl3=`place ${authPlace}`
                                api.screen.screenContentl4='Take your'
                                api.screen.screenContentl5='scooter at'
                                api.screen.screenContentl6=`place ${authPlace}`
                                api.screen.mode='n'
                                save(true)
                                break;
                            } else {
                                for(let place of api.places){
                                    if(place.capt) continue;
                                    authPlace=place.id
                                    place.owner=user.nm
                                    place.state='pending'
                                    authProc='waitingForCapt'
                                    api.screen.screenContentl1='Put your'
                                    api.screen.screenContentl2='scooter at'
                                    api.screen.screenContentl3=`place ${authPlace}`
                                    api.screen.screenContentl4='Put your'
                                    api.screen.screenContentl5='scooter at'
                                    api.screen.screenContentl6=`place ${authPlace}`
                                    api.screen.mode='n'
                                    save(true)
                                    break;
                                }
                            }
                            return;
                        } else if (userVerified.length===api.users.length){
                            const wait = async ()=>{
                                api.screen.screenContentl1='Unknown user'
                                api.screen.screenContentl2='or incorect'
                                api.screen.screenContentl3='password.'
                                api.screen.screenContentl4='Unknown user'
                                api.screen.screenContentl5='or incorect'
                                api.screen.screenContentl6='password.'
                                api.screen.mode='n'
                                save(true)
                                await setTimeout(2000)
                                api.screen.screenContentl1='Welcome to'
                                api.screen.screenContentl2='the parking!'
                                api.screen.screenContentl3=''
                                api.screen.screenContentl4='Available:'
                                api.screen.screenContentl5=`-> ${availableParks()}`
                                api.screen.screenContentl6=''
                                api.screen.delay=4000
                                api.screen.mode='d'
                                authProc==='free'
                                save(true)
                            }
                            wait()
                        }
                    }
                    
                }
                break;
        }
    })
})