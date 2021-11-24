<script setup lang="ts">
import { pickerData, nbMaterial, materialData } from '../../materials.js'
var materialIndex = Object.keys(materialData);

var getColor = function(mat, i)
{
    var matData=materialData[mat];
    if (i == pickerData.material){
        return {'border': '5px solid red', 'background-color': 'rgba('+matData.color[0] +','+matData.color[1] +','+matData.color[2] +','+matData.transparency/255 +')'}    
    } else {
        return {'background-color': 'rgba('+matData.color[0] +','+matData.color[1] +','+matData.color[2] +','+matData.transparency/255 +')'}
    } 
}
</script>

<template>
    <div class="my-2 selector" v-for="i in nbMaterial" :key="i">
        <Button noStyle="true" class ='tile'
            @click="pickmaterial(i)"
            :style='getColor(materialIndex[i-1], i)'
            :tooltip="'Click to place ' + materialIndex[i-1] + ' briqs'"
            >
            {{ getMaterialNumber(i) }}</Button>
    </div>
</template>

<script lang="ts">
import Button from '../generic/Button.vue'

import { defineComponent } from 'vue'
export default defineComponent({
    computed: {
        builderData: function() { return this.$store.state.builderData; },
    },
    components: {
        Button
    },
    methods:
    {
        pickmaterial : function(mat) {
            pickerData.material=mat
        },
        getMaterialNumber : function (i)
        {
            var numberMaterial = {};
            for (let brick of this.builderData.briqsDB.briqs.values())
            {
                if (brick.set != 0)
                    continue
                if (!(brick.material in numberMaterial))
                    numberMaterial[brick.material]=0;
                numberMaterial[brick.material]++;
            }
            if (!numberMaterial[i])
                return 0;
            numberMaterial[i] -= this.builderData.currentSet.usedByMaterial[i] ?? 0;
            return numberMaterial[i];
        }
    }
})
</script>

<style scoped>
div.button_selector{
}
.button_selector * {
    color: black;
    font-weight:700;
}

button.tile{
    height: 48px;
    width: 48px;
    border: none;
    display: block;
    border-radius: 10px;
}

</style>