import { computed, ref } from 'vue';
export function useEquipmentFilter(store) {
    const filters = ref({ query: '', categoryId: 0, location: '', status: '' });
    const equipment = computed(() =>
        store.equipment.value.filter((item) => {
            const f = filters.value;
            const status =
                item.status === 'AVAILABLE' && item.isReservedOn(new Date()) ? 'RESERVED' : item.status;
            return (
                (!f.query ||
                    `${item.name} ${item.code} ${item.description}`
                        .toLowerCase()
                        .includes(f.query.trim().toLowerCase())) &&
                (!f.categoryId || item.categoryId === f.categoryId) &&
                (!f.location || item.location.toLowerCase().includes(f.location.trim().toLowerCase())) &&
                (!f.status || status === f.status)
            );
        }),
    );
    return { filters, equipment };
}
