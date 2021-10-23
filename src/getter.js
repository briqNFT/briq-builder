var user_bricks = [];

import { reactive } from "vue"
export var brickstore = reactive({user_bricks:[]});

var headers = new Headers();
headers.append("Content-Type", "application/json");

import getBaseUrl from './url.js'
var base_url = getBaseUrl();


export function populate() {
    var data = {
        method: 'POST',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
            "inputs": {
            }
        })
    };

    fetch(`${base_url}/get_bricks/${17}`, data)
        .then(x => x.json())
        .then(x => {
            brickstore.user_bricks = x.value.map(x => ({ "token_id": x[0], "mat": x[1], "set": x[2] }));
        }).catch(x => console.log(x))



    return brickstore.user_bricks;
}