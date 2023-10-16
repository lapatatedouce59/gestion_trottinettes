let data=false
let uuid=false



let screenContentl1 = document.getElementById('screenContentl1')
let screenContentl2 = document.getElementById('screenContentl2')
let screenContentl3 = document.getElementById('screenContentl3')

let chpName = document.getElementById('chpName')
let chpPwd = document.getElementById('chpPwd')

let validateChoiceBtn = document.getElementById('validateChoiceBtn')
let setBtn = document.getElementById('setBtn')


window.WebSocket = new WebSocket('ws://localhost:8083')

window.WebSocket.addEventListener('open', () => {
    window.WebSocket.send(JSON.stringify({
        op: 1
    }))
    window.WebSocket.addEventListener('message', msg =>{
        data = JSON.parse(msg.data);

        if(data.op===900){
            if(data.code===503){
                alert(data.message)
            }
            if(data.code===401){
                
            }
            if(data.code===403){
                screenShow('dynamic', ['***HTTP ERROR***','Code: 403','Forbidden','***HTTP ERROR***','Error occured in','authentification'],2000)
            }
        }
        if(data.op===2){
            uuid=data.uuid
            let parsedJson = data.content
            data = parsedJson
            reloadElements()
        }
        if(data.op===3){
            let parsedJson = data.content
            data = parsedJson
            reloadElements()
        }
    })
})
let sleepProm=false
function sleep(ms) {
    let prom = new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
    sleepProm=prom
    return prom
    
}
window.WebSocket.addEventListener('close', ()=>{
    screenShow('dynamic', ['***HTTP ERROR***','Code: 504','Timed out','***HTTP ERROR***','Socket is closed','or unreachable'],2000)
})

let pauseIntervalVerif={ private: 0, actual: 0, next: 0 }

let screenInterval=[]
function screenShow(mode, txt, delay=2000){
    pauseIntervalVerif.private=pauseIntervalVerif.actual
    if(mode==='static'){
        for(let inter of screenInterval){
            clearInterval(inter)
        }
        screenContentl1.innerText=txt[0]
        screenContentl2.innerText=txt[1]
        screenContentl3.innerText=txt[2]
    } else if(mode==='dynamic'){
        screenInterval.push(setInterval(async()=>{
            console.log(pauseIntervalVerif)
            if(pauseIntervalVerif.actual===pauseIntervalVerif.private){
                screenContentl1.innerText=txt[0]
                screenContentl2.innerText=txt[1]
                screenContentl3.innerText=txt[2]
                await sleep(delay/2)
                console.log(pauseIntervalVerif)
                if(pauseIntervalVerif.actual===pauseIntervalVerif.private){
                    screenContentl1.innerText=txt[3]
                    screenContentl2.innerText=txt[4]
                    screenContentl3.innerText=txt[5]
                } else return;
            }
            
        },delay))
    }
}

for(let elem of document.getElementsByClassName('checkboxCapt')){
    elem.addEventListener('input',()=>{
        window.WebSocket.send(JSON.stringify({
            op: 4,
            cmd: "CAPT-STATE",
            args: { id: elem.id.replace('captTrott',''), state: elem.checked },
            uuid: uuid
        }))
    })
}

function reloadElements(){
    pauseIntervalVerif.actual++

    reloadCapts()
    reloadVoys()
    reloadScreenContent()
}
function reloadCapts(){
    for(let place of data.places){
        document.getElementById(`captTrott${place.id}`).checked=place.capt;
    }
}
let voyIntervals=[]
function reloadVoys(){
    for(let inter of voyIntervals){
        clearInterval(inter)
    }
    for(let place of data.places){
        switch(place.state){
            case 'free':
                document.getElementById(`voy${place.id}`).classList.remove('voyOff')
                document.getElementById(`voy${place.id}`).classList.add('voyOn')
                break;
            case 'took':
                document.getElementById(`voy${place.id}`).classList.remove('voyOn')
                document.getElementById(`voy${place.id}`).classList.add('voyOff')
                break;
            case 'pending':
                voyIntervals.push(setInterval(()=>{
                    document.getElementById(`voy${place.id}`).classList.toggle('voyOn')
                },250))
                break;
        }
    }
}
function reloadScreenContent(){
    for(let inter of screenInterval){
        clearInterval(inter)
    }
    if(data.screen.mode==='n'){
        screenShow('static',[data.screen.screenContentl1,data.screen.screenContentl2,data.screen.screenContentl3])
    } else if (data.screen.mode==='d'){
        screenShow('dynamic',[data.screen.screenContentl1,data.screen.screenContentl2,data.screen.screenContentl3,data.screen.screenContentl4,data.screen.screenContentl5,data.screen.screenContentl6],data.screen.delay)
    }
}

validateChoiceBtn.addEventListener('click',()=>{
    window.WebSocket.send(JSON.stringify({
        op: 4,
        cmd: "IDENTIFY",
        args: { name: chpName.value, pwd: chpPwd.value },
        uuid: uuid
    }))
    chpName.value=''
    chpPwd.value=''
})