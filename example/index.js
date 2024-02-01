import {message} from './message.js'
import {sender} from './sender.js'

async function log() {
    const { asyncMessage, asyncSender} =await new Promise(resolve => {
        setTimeout(() => resolve({message, sender}), 1200)
    })
    console.log(asyncMessage, asyncSender);
}


log();