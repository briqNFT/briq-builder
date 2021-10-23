import { reactive } from "vue"
export var brickstore = reactive({user_bricks:[]});

//mock call
var user_bricks_mock = [];

function populate_mock(){
    for (let i = 0; i < 41; i++) {
        for (let j = 0; j<4; j++){
            user_bricks_mock.push(["0x"+i*100+j, j, 0]);
        }
    }
    brickstore.user_bricks = user_bricks_mock;
}


var headers = new Headers();
headers.append("Content-Type", "application/json");

export function populate() {
    setTimeout(populate_mock, 1000);
    return
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
            user_bricks = x.value.map(x => ({ "token_id": x[0], "mat": x[1], "set": x[2] }));
            console.log(user_bricks);
        }).catch(x => console.log(x))



    return user_bricks;
}