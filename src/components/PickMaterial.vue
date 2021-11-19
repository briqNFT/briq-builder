<script setup lang="ts">
import { pickerData, nbMaterial, materialData } from '../materials.js'
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
    <div>
        <div class="button_selector">
            <div class="selector" v-for="i in nbMaterial" :key="i">
                <button @click="pickmaterial(i)" class ='tile' :style='getColor(materialIndex[i-1], i)'>{{ getMaterialNumber(i) }}</button>
            </div>
        </div>
        <p>Editing set {{ builderData.currentSet.id }}</p>
        <template v-if="builderData.briqsDB.briqs.size">
            <p>{{ builderData.briqsDB.briqs.size }} briqs loaded!</p>
        </template>
        <template v-else="">
            <p>...Briqs are loading...</p>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    computed: {
        builderData: function() { return this.$store.state.builderData; },
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
            numberMaterial[i] -= builderData.currentSet.usedByMaterial[i] ?? 0;
            return numberMaterial[i];
        }
    }
})
</script>

<style scoped>
* {
    margin:0;
    padding:0;
}
div.button_selector{
    display: flex; /*https://css-tricks.com/snippets/css/a-guide-to-flexbox/ */
    flex-direction: row;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    align-content: flex-start;
    flex-wrap: wrap;
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