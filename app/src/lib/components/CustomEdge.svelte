<script lang="ts">
  import {
    BaseEdge,
    getBezierPath,
    type EdgeProps,
    Position,
    EdgeLabel
  } from '@xyflow/svelte';

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    selected,
    data,
  }: EdgeProps = $props();

  let [edgePath, labelX, labelY] = $derived(
    getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
  );
</script>

<BaseEdge {id} path={edgePath} />

{#if selected}
  <EdgeLabel x={labelX} y={labelY} >
    <h3>{data.sourceCourse.name} -> {data.targetCourse.name}</h3>
  </EdgeLabel>
{/if}

<style>
  :global(.svelte-flow__edge-path) {
    stroke: lightgray;
    stroke-width: 2;
  }
  :global(.svelte-flow__edge.selected .svelte-flow__edge-path) {
    stroke-width: 3;
  }
  :global(.svelte-flow__edge-label) {
    background: transparent;
    backdrop-filter: blur(4px);
    border-radius: 0.5rem;
  }
</style>