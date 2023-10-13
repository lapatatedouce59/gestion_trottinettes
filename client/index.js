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
        }
        if(data.op===2){
            uuid=data.uuid
        }
        if(data.op===3){
            reloadElements()
        }
    })
})
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
window.WebSocket.addEventListener('close', ()=>{
    screenShow('dynamic', ['***HTTP ERROR***','Code: 504','Timed out','***HTTP ERROR***','Socket is closed','or unreachable'],2000)
})

let screenInterval=0
function screenShow(mode, txt, delay=2000){
    if(mode==='static'){
        clearInterval(screenInterval)
        screenContentl1.innerText=txt[0]
        screenContentl2.innerText=txt[1]
        screenContentl3.innerText=txt[2]
    } else if(mode==='dynamic'){
        screenInterval=setInterval(async()=>{
            screenContentl1.innerText=txt[0]
            screenContentl2.innerText=txt[1]
            screenContentl3.innerText=txt[2]
            await sleep(delay/2)
            screenContentl1.innerText=txt[3]
            screenContentl2.innerText=txt[4]
            screenContentl3.innerText=txt[5]
        },delay)
    }
}



function reloadElements(){
    reloadCapts()
    reloadVoys()
    reloadScreenContent()
}
function reloadCapts(){
    for(let place of data.places){
        document.getElementById(`captTrott${place.id}`).checked=place.capt
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
    clearInterval(screenInterval)
    screenContentl1.innerText=data.screen.screenContentl1
    screenContentl2.innerText=data.screen.screenContentl2
    screenContentl3.innerText=data.screen.screenContentl3
}

validateChoiceBtn.addEventListener('click',()=>{
    window.WebSocket.send(JSON.stringify({
        op: 4,
        cmd: "IDENTIFY",
        args: { name: chpName.ariaValueMax, pwd: chpPwd.value },
        uuid: uuid
    }))
    chpName.value=''
    chpPwd.value=''
})