//import util from "util"
const util = require("util");
const fs = require("fs");
class Mutex {
    constructor() {
        this.lock = false;
    }

    async acquire() {
        while (true) {
            if (this.lock === false) {
                break;
            }
			// custom sleep (setTimeout)
            await sleep(100);
        }

        this.lock = true;
    }

    release() {
        this.lock = false;
    }
}
const mutex = new Mutex();
const log_server = async (d) => {
    const date = new Date();
    const timeStamp = 
    "["+date.getFullYear().toString().padStart(4, "0")+
    "-"+(date.getMonth()+1).toString().padStart(2, "0")+
    "-"+date.getDate().toString().padStart(2, "0")+
    " "+date.getHours().toString().padStart(2, "0")+
    ":"+date.getMinutes().toString().padStart(2, "0")+
    ":"+date.getSeconds().toString().padStart(2, "0")+"]";
    const logText = timeStamp + " => " + util.format(d);
    console.log(logText);

    // await mutex.acquire();
    // {
    //     try {
    //         fs.writeFileSync('./log.txt', logText + "\n", { flag: 'a+' });
    //     } catch (error) {
    //         console.error("Can't Log!!");
    //         console.error(error)
    //     }
    // }
    // mutex.release();
}

const secToStamp = (time) => {
    const second = time % 60
    const minute = parseInt(time / 60);
    const hour =  parseInt(time / 3600);
    if(hour > 0)
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    else
        return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
}


const sleep = (ms) => {
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    });
}
// error test
// try {
//     const k = "";
//     k = "a";

// } catch (error) {
//    log_server(error)
// }
module.exports = { log_server, secToStamp, sleep };