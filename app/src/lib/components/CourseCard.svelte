<script lang="ts">
  import { Info, Pencil, CircleCheck, CircleX, CircleQuestionMark, X, GraduationCap, NotebookPen, Undo, Trash2 } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let { course } =  $props();

  const COLOR_DEFAULT = "lightgrey";
  const COLOR_WORK = "#B7EBE8";
  const COLOR_DONE = "#CEEBB7";

  const resolve = <T,>(val: T | T[]): T => Array.isArray(val) ? val[0] : val;

  const setCourseColor = (new_color: string) => {
    if (color === new_color) {
      color = COLOR_DEFAULT;
    } else {
      color = new_color;
    }
  };

  const enableWorkButtonColor = () => {
    isWorkButtonActive = true;
    isDoneButtonActive = false;
  };

  const enableDoneButtonColor = () => {
    isWorkButtonActive = false;
    isDoneButtonActive = true;
  };

  const disableBothButtons = () => {
    isWorkButtonActive = false;
    isDoneButtonActive = false;
  };

  let popoverId = $state("");
  let isEditing = $state(false);
  let color = $state(COLOR_DEFAULT);
  let isWorkButtonActive = $state(false);
  let isDoneButtonActive = $state(false);

  const name = $derived(resolve(course.name));
  const type = $derived(resolve(course.type));
  const credits = $derived(resolve(course.credits));
  const requiredVal = $derived(resolve(course.required));
  const subcategory = $derived(resolve(course.subcategory));
  const recommendedSemester = $derived(resolve(course.recommendedSemester));
  const language = $derived(resolve(course.language));
  const url = $derived(resolve(course.url));
  const frequency = $derived(resolve(course.frequency));
  const availability = $derived(resolve(course.availability));
  const description = $derived( Array.isArray(course.description) ? course.description.join(' ') : course.description)
  const module = $derived(resolve(course.module).name);
  const prerequisites = $derived(course.prerequisites.size > 0 ? resolve(course.prerequisites).name : "")

  // 0 = not required, 1 = required in major, 2 = required in major & minor
  // 3 = Freifach, 4 = Wahlfach, 5 = Pflichtfach
  const isRequired = $derived(() => {
    if ([1, 2, 5].includes(requiredVal)) return "required";
    if ([0, 3, 4].includes(requiredVal)) return "not-required";
    return "NAN";
  });


  onMount(() => {
    popoverId = crypto.randomUUID();     //creation of a unique id for each article
  });

</script>

<div class="course-card-wrapper" style="--course-background-color: {color}">
  <h1>{name}</h1>

  <div class="short-info-container">
    <div class="short-info-item">
      <h2>Type:</h2>
      <p>{type}</p>
    </div>

    <div class="short-info-item">
      <h2>Credits:</h2>
      <p>{credits}</p>
    </div>

    <div class="short-info-item">
      <h2>Required:</h2>
      {#if isRequired() === "required"}
        <CircleCheck size="1rem" />
      {:else if isRequired() === "not-required"}
        <CircleX size="1rem" />
      {:else if isRequired() === "NAN"}
        <CircleQuestionMark size="1rem" />
      {/if}
    </div>
  </div>

  <div class="action-wrapper">
    <button class="action-button"
            onclick={() => isEditing = !isEditing}>
      <Pencil size="1rem" />
    </button>
    <button class="action-button">
      <!-- TODO delete course entry at click here -->
      <Trash2 size="1rem" />
    </button>
    <button class="action-button"
            popovertarget={popoverId}>
      <Info size="1rem" />
    </button>
  </div>

  {#if isEditing}
    <div class="course-card-edit">
      <div class="edit-options">
        <div class="edit-item">
          <button class={isWorkButtonActive ? "button-active" : "button-disabled"}
                  onclick={() => {
                   setCourseColor(COLOR_WORK);
                   enableWorkButtonColor()
                  }}></button>
          <h3>In Work</h3>
          <NotebookPen size="1rem"/>
        </div>
        <div class="edit-item">
          <button class={isDoneButtonActive ? "button-active" : "button-disabled"}
                  onclick={() => {
                   setCourseColor(COLOR_DONE);
                   enableDoneButtonColor();
                  }}></button>
          <h3>Done</h3>
          <GraduationCap size="1rem"/>
        </div>
      </div>

      <div class="close-options">
        <button onclick={() => {
          setCourseColor(COLOR_DEFAULT);
          disableBothButtons();
        }}>
          <Undo size="0.9rem" />
        </button>
        <button onclick={() => isEditing = !isEditing}>
          <X size="0.9rem" />
        </button>
      </div>
    </div>
  {/if}
</div>

<div popover
     id={popoverId}
     class="course-popover-container"
     aria-modal="true"
     aria-labelledby="popover-{popoverId}">

  <div class="course-popover-header">
    <button class="close-popover"
            popovertarget={popoverId}
            popovertargetaction="hide"
            aria-label="Close popover">
      <X size="1.5rem" />
    </button>
    <h1>{name}</h1>
  </div>

  <div class="course-info-container">
    <div class="info-item">
      <h2>Module: </h2>
      <p>{module}</p>
    </div>

    <div class="info-item">
      <h2>Subcategory: </h2>
      <p>{subcategory}</p>
    </div>

    {#if recommendedSemester != null}
      <div class="info-item">
        <h2>Recommended Semester: </h2>
        <p>{recommendedSemester} ERROR</p>
      </div>
    {/if}

    <div class="info-item">
      <h2>Language: </h2>
      <p>{language}</p>
    </div>

    <div class="info-item">
      <h2>Frequency: </h2>
      <p>{frequency}</p>
    </div>

    <div class="info-item">
      <h2>Availability: </h2>
      <p>{availability}</p>
    </div>

    {#if prerequisites.size === 0}
      <div class="info-item">
        <h2>Prerequisites: </h2>
        <p>{prerequisites}</p>
      </div>
    {/if}

    <h2>Description</h2>
    <p>{description}</p>

    <a href={url} target="_blank" rel="noopener noreferrer" class="course-link">
      View Course Details
    </a>
  </div>
</div>

<style>
  .course-card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background-color: var(--course-background-color);
    border-radius: 1rem;
    max-width: 15rem;
    text-align: center;
    gap: 0.3rem;
    padding: 0.3rem;

    h1 {
      font-size: 1rem;
      margin: 0;
    }

    h2 {
      font-size: 0.8rem;
      margin: 0.2rem;
      font-weight: bold;
    }

    p {
      font-size: 0.8rem;
      margin: 0.2rem;
    }

    .short-info-container {
      display: flex;
      flex-direction: row;

      .short-info-item {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
    }

    .action-wrapper {
      display: flex;
      gap: 0.75rem;

      .action-button {
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
      }
    }

    .course-card-edit {
      display: flex;
      flex-direction: row;
      padding: 0.5rem;
      background-color: white;
      border-radius: 0.75rem;
      gap: 0.75rem;

      button {
        cursor: pointer;
        border-radius: 0.75rem;
        border: none;
      }

      .edit-options {
        display: flex;
        flex-direction: column;
        margin-top: 0.5rem;

        .edit-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;

          h3 {
            font-size: 0.8rem;
            font-weight: normal;
            margin: 0;
            color: black;
          }

          .button-active {
            border-radius: 5rem;
            padding: 0.3rem;
            background-color: darkgrey;
          }

          .button-disabled {
            border-radius: 5rem;
            padding: 0.3rem;
            background-color: lightgrey;
          }
        }
      }

      .close-options {
        display: flex;
        align-self: flex-start;
        justify-self: flex-start;
        gap: 0.1rem;

        button {
          border: none;
          background: none;
          padding: 0;
        }
      }
    }
  }

  .course-popover-container {
    width: 70vw;
    height: fit-content;
    max-height: 70vh;
    flex-direction: column;
    border: none;
    border-radius: 1rem;
    animation: background-animation linear;
    overflow-y: auto;
    padding-bottom: 1rem;

    &:popover-open {
      pointer-events: auto;
    }

    h2 {
      font-size: 0.8rem;
      margin: 0.2rem;
      font-weight: bold;
    }

    p {
      font-size: 0.8rem;
      margin: 0.2rem;
    }

    .course-popover-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 1rem;
      padding-left: 3rem;
      padding-right: 3rem;

      .close-popover {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        cursor: pointer;
        border: none;
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .course-info-container {
      display: flex;
      flex-direction: column;

      .info-item {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }

      .course-link {
        font-size: 0.8rem;
        text-decoration: underline;
      }
    }
  }

  .course-popover-container::backdrop {
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(0.1rem);
  }
</style>