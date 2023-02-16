import { ref } from 'vue';

const searchBar = ref<string>();
const sortOrder = ref('a_z');

export const useSearch = function() {
    return {
        searchBar,
        sortOrder,
    }
}
