<script setup lang="ts">
import { picker, nbMaterial, materialData } from '../materials.js'
var materialIndex = Object.keys(materialData);

var getColor = function (mat){
var matData=materialData[mat];
return {'background-color': 'rgba('+matData.color[0] +','+matData.color[1] +','+matData.color[2] +','+matData.transparency/255 +')'
}
}
</script>

<template>
<div class="button_selector">
    <div class="selector" v-for="i in nbMaterial" :key="i">
        <button @click="pickmaterial(i)" class ='tile' :style='getColor(materialIndex[i-1])'></button>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    methods :{
        pickmaterial : function(mat){
            console.log(mat)
            picker.material=mat
        }
    }
})
</script>

<style scoped>

div.button_selector{
    display: flex;
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