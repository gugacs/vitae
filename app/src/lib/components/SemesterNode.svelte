<script lang="ts">

  export let data
</script>

<div class="semester-node">
  <h2>{data.label} {data.semesterNumber}</h2>

  {#if data.label !== 'Modules'}
    <h3>{data.semesterECTS}/30 ECTS</h3>
  {/if}

</div>

<style>
  .semester-node {
    padding: 0.5rem;
    border: none;
    background: transparent;
    width: 15rem;
    text-align: center;
  }
</style>