<script lang="ts">
    import { SvelteFlow, MiniMap, Controls, Background } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import { curriculumStore } from "$lib/states/curriculum.svelte";
    import CustomNode from "$lib/components/CustomNode.svelte";
    import CustomEdge from "$lib/components/CustomEdge.svelte";
    import SemesterNode from "$lib/components/SemesterNode.svelte";

    const nodeTypes = { custom: CustomNode, header: SemesterNode };
    const edgeTypes = { custom: CustomEdge };

    let nodes = $state.raw([]);
    let edges = $state.raw([]);

    $effect(() => {
      const showElectiveModules = true;
      const verticalSpacing = 300;
      const horizontalSpacing = 500;
      const columnHeaderYPosition = -200;

      // filter if the elective modules should be shown or not
      const filteredCourses = showElectiveModules
        ? $curriculumStore.courses
        : $curriculumStore.courses.filter(course => {
          const semester = parseInt(course.recommended_semester);
          return isNaN(semester) || semester !== 0;
        });

      // group courses by semester
      const coursesBySemester = filteredCourses.reduce((acc, course) => {
        let semester = parseInt(course.recommended_semester); // parseInt to handle strings like "2;2" and convert to a number

        if (isNaN(semester)) {
          semester = 0; // default to semester 0 if parsing fails
        }
        if (!acc[semester]) {
          acc[semester] = [];
        }
        acc[semester].push(course);
        return acc;
      }, {});

      console.log(coursesBySemester);

      const sortedSemesters = Object.keys(coursesBySemester).sort((a, b) => Number(a) - Number(b));

      const headerNodes = sortedSemesters.map((semester, columnIndex) => {
        if (parseInt(semester) == 0) {
          return {
            id: `header-${semester}`,
            type: 'header',
            position: {
              x: columnIndex * horizontalSpacing,
              y: columnHeaderYPosition
            },
            data: { label: 'Modules'},
            draggable: false,
            selectable: false,
            connectable: false,
            style: 'font-size: 1.5rem; font-weight: bold; text-align: center; width: 300px; background: transparent; border: none'
          }
        }

        return {
          id: `header-${semester}`,
          type: 'header',
          position: {
            x: columnIndex * horizontalSpacing,
            y: columnHeaderYPosition
          },
          data: { label: `Semester ${semester}`, semesterECTS: 30 },
          draggable: false,
          selectable: false,
          connectable: false,
          style: 'font-size: 1.5rem; font-weight: bold; text-align: center; width: 300px; background: transparent; border: none'
        };
      });

      const courseIdToNodeMap = new Map<string, { nodeId: string; semester: number }[]>();

      // create nodes from the grouped structure and adapt the map in the same loop
      const newNodes = Object.keys(coursesBySemester)
        .sort((a, b) => Number(a) - Number(b))
        .flatMap((semester, columnIndex) => {
          const coursesInSemester = coursesBySemester[semester];

          return coursesInSemester.map((course, rowIndex) => {
            const nodeId = `${course.id}-${semester}-${rowIndex}`; // Unique ID

            if (!courseIdToNodeMap.has(course.id)) {
              courseIdToNodeMap.set(course.id, []);
            }
            courseIdToNodeMap.get(course.id)?.push({ nodeId, semester });

            return {
              id: nodeId,
              type: 'custom',
              position: {
                x: columnIndex * horizontalSpacing,
                y: rowIndex * verticalSpacing
              },
              data: { label: course.name, lv: course },
            };
          });
        });

      // iterate through all courses again to create edges
      const newEdges = [];
      for (const targetNode of newNodes) {
        const targetCourse = targetNode.data.lv;

        // Create a clean list of prerequisite IDs, regardless of the source data type
        let prerequisiteIds = [];
        if (targetCourse.prerequisites) {
          if (typeof targetCourse.prerequisites === 'string' && targetCourse.prerequisites.length > 0) {
            prerequisiteIds = targetCourse.prerequisites.split(';').map(id => id.trim());
          } else if (Array.isArray(targetCourse.prerequisites)) {
            prerequisiteIds = targetCourse.prerequisites.map(p => p.id);
          }
        }

        // loop over the clean array of IDs
        if (prerequisiteIds.length > 0) {
          for (const prereqId of prerequisiteIds) {
            const possibleSources = courseIdToNodeMap.get(prereqId);
            if (!possibleSources) continue; // skip if prerequisite node doesn't exist

            const bestSource = possibleSources
              .sort((a, b) => b.semester - a.semester)[0];

            if (bestSource && bestSource.nodeId !== targetNode.id) {
              newEdges.push({
                id: `e-${bestSource.nodeId}-${targetNode.id}`,
                type: 'custom',
                source: bestSource.nodeId,
                target: targetNode.id,
              });
            }
          }
        }
      }

      nodes = [...headerNodes, ...newNodes];
      edges = newEdges;
    });
</script>

<div style:height="80rem">
  <SvelteFlow bind:nodes bind:edges {nodeTypes} {edgeTypes} >
    <MiniMap />
    <Controls />
    <Background />
  </SvelteFlow>
</div>

<style>
  :global(.svelte-flow__edge-path) {
    stroke: lightgrey;
    stroke-width: 2;
  }
</style>
