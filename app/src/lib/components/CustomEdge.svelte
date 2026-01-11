<script lang="ts">
  import {
    BaseEdge,
    getBezierPath,
    type EdgeProps,
    Position,
  } from '@xyflow/svelte';

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
  }: EdgeProps = $props();

  let [edgePath] = $derived(
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

<style>

</style>