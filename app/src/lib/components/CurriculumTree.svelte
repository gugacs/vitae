<script lang="ts">
  import { SvelteFlow, MiniMap, Controls, Background } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  let nodes = $state.raw([
      {
          id: '1',
          position: { x: 10, y: 10 },
          data: { label: 'Course 1' },
      },
      {
          id: '2',
          position: { x: 100, y: 100 },
          data: { label: 'Course 2' },
      },
      {
          id: '3',
          position: { x: 200, y: 200 },
          data: { label: 'Course 3' },
      },
      {
          id: '4',
          position: { x: 400, y: 50 },
          data: { label: 'Course 4' },
      },
  ]);

  let edges = $state.raw([{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-2', source: '2' , target: '3' }]);
</script>

<div style:height="30rem">
  <SvelteFlow bind:nodes bind:edges>
    <MiniMap />
    <Controls />
    <Background />
  </SvelteFlow>
</div>

<style>

</style>
