<script lang="ts">
/**
 * A generic component to set tooltip on hover enter and remove it on hover leave.
 */
import { setTooltip } from '../../Messages';
import { defineComponent, h } from "vue";
export default defineComponent({
    props: ["tooltip", "useCursor"],
    methods: {
        setTooltip
    },
    render() {
        let tooltip = this.$props.tooltip;
        let cls = (this.$attrs?.class ?? "") + (this.$props.useCursor ? " cursor-help" : "");
        return h(this.$slots.default()[0], {
            ...this.$attrs,
            class: cls,
            onPointerenter() { setTooltip(tooltip) },
            onPointerleave() { setTooltip() },
        });
    }
});
</script>
