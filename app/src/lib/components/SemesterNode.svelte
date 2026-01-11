<script lang="ts">

  export let data
</script>

<div class="course-node">
  <h2>{data.label} {data.semesterNumber}</h2>

  {#if data.label !== 'Modules'}
    <h3>{data.semesterECTS}/30 ECTS</h3>
  {/if}

</div>

<style>
  .course-node {
    padding: 0.5rem;
    border: none;
    background: transparent;
    width: 15rem;
    text-align: center;
  }

  .course-node:hover {
    background: #eee;
  }
</style>