<script lang="ts">
  import { curriculumStore } from "$lib/states/curriculum.svelte";
  import CourseCard from "./CourseCard.svelte";

  const getKey = (name: string | string[], i: number) =>
    (Array.isArray(name) ? name[0] : name) + "-" + i;
</script>

<div>
  <h1>Course List</h1>
  <div class="course-grid">
    {#each $curriculumStore.courses as courseItem, index (getKey(courseItem.name, index))}
      <CourseCard course={courseItem} />
    {:else}
      <p>No courses found in the curriculum.</p>
    {/each}
  </div>
</div>

<style>
  .course-grid {
    display: grid;
    grid-template-columns: repeat(1, 15rem);
    gap: 1.5rem;
    padding: 1rem;
    justify-content: center;
  }
</style>