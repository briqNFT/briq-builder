<script setup lang="ts">
import { picker, nbMaterial, materialData } from '../materials.js'
import { brickstore } from '../getter.js'
var materialIndex = Object.keys(materialData);

var getColor = function (mat, i){
    var matData=materialData[mat];
    if (i == picker.material){
        return {'border': '5px solid red', 'background-color': 'rgba('+matData.color[0] +','+matData.color[1] +','+matData.color[2] +','+matData.transparency/255 +')'}    
    } else {
        return {'background-color': 'rgba('+matData.color[0] +','+matData.color[1] +','+matData.color[2] +','+matData.transparency/255 +')'}
    } 
}

</script>

<template>
<div class="button_selector">
    <div class="selector" v-for="i in nbMaterial" :key="i">
        <button @click="pickmaterial(i)" class ='tile' :style='getColor(materialIndex[i-1], i)'></button>
    </div>
    <p>{{ brickstore.user_bricks.length }}</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    methods :{
        pickmaterial : function(mat){
            picker.material=mat
        }
    }
})
</script>

<style scoped>

div.button_selector{
    display: flex; /*https://css-tricks.com/snippets/css/a-guide-to-flexbox/ */
    flex-direction: row;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    align-content: flex-start;
    flex-wrap: wrap;
}

button.tile{
    height: 48px;
    width: 48px;
    border: none;
    display: block;
    border-radius: 10px;
}

</style>