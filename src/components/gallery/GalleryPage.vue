<script setup lang="ts">
import { backendManager } from '@/Backend';
import { useGenesisStore } from '@/builder/GenesisStore';
import { getCurrentNetwork } from '@/chain/Network';
import Footer from '@/components/landing_page/Footer.vue';
import Header from '@/components/landing_page/Header.vue';
import { ref, watch } from 'vue';

const genesisStore = useGenesisStore();

const sort = ref('latest')
const galleryData = ref<Object[]>([])
const loading = ref(true)

watch([sort], () => {
  fetchGalleryData()
})

async function fetchGalleryData() {
  loading.value = true
  let data = await backendManager.fetch(`v1/${getCurrentNetwork()}/gallery/static_data`)

  if (data) {
    galleryData.value = Object.entries(data)
  }

  loading.value = false
}

fetchGalleryData()
</script>

<template>
  <Header />

  <div class="container m-auto min-h-screen">
    <h3 class="mt-10 mb-4">Gallery</h3>
    <div class="flex flex-wrap gap-3 mb-10" v-if="!loading && galleryData.length > 0">

      <div v-for="item in galleryData" class="item">
        <RouterLink :to="{ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: item[0] } }">
          <img :src="genesisStore.coverItemRoute(item[1].booklet_id, true)" alt="" :width="300" />
        </RouterLink>
      </div>

    </div>

  </div>

  <Footer />
</template>


<style scoped>
  .item {
    cursor: pointer;
  }

  .item:hover {
    box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.5)
  }
</style>