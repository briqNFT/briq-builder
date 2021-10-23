var user_bricks = [];

import { reactive } from "vue"
export var brickstore = reactive({user_bricks:[]});

var headers = new Headers();
headers.append("Content-Type", "application/json");

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

    fetch(`http://localhost:5000/get_bricks/${17}`, data)
        .then(x => x.json())
        .then(x => {
            brickstore.user_bricks = x.value.map(x => ({ "token_id": x[0], "mat": x[1], "set": x[2] }));
            console.log(brickstore.user_bricks);
        }).catch(x => console.log(x))



    return brickstore.user_bricks;
}