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
  let data = await backendManager.fetch(`v1/${getCurrentNetwork()}/ducks_frens/all_sets_static_data`)

  if (data) {
    galleryData.value = Object.values(data)
  }

  loading.value = false
}

fetchGalleryData()
</script>

<template>
  <Header />

  <div class="container m-auto min-h-screen">
    <h3 class="mt-10 mb-4">Gallery</h3>
    <div class="flex flex-wrap gap-3 mb-10" v-if="galleryData.length > 0">

      <div v-for="item in galleryData" class="cursor-pointer">
        <RouterLink :to="{ name: 'UserCreation', params: { network: getCurrentNetwork(), set_id: 'lk' } }">
          <img :src="genesisStore.coverItemRoute(item.booklet_id, true)" alt="" :width="300" />
        </RouterLink>
      </div>

    </div>

  </div>

  <Footer />
</template>


<style scoped></style>