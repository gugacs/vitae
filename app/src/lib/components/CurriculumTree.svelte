<script lang="ts">
    import { SvelteFlow, MiniMap, Controls, Background, type Node } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import { curriculumStore } from "$lib/states/curriculum.svelte";
    import CustomNode from "$lib/components/CustomNode.svelte";
    import CustomEdge from "$lib/components/CustomEdge.svelte";
    import SemesterNode from "$lib/components/SemesterNode.svelte";
    import HorizontalSeparatorNode from "$lib/components/HorizontalSeparatorNode.svelte";
    import VerticalSeparatorNode from "$lib/components/VerticalSeparatorNode.svelte";

    const nodeTypes = {
      custom: CustomNode,
      header: SemesterNode,
      horizontalSeparator: HorizontalSeparatorNode,
      verticalSeparator: VerticalSeparatorNode };
    const edgeTypes = { custom: CustomEdge };

    let nodes = $state.raw([]);
    let edges = $state.raw([]);

    const verticalSpacing = 300;
    const horizontalSpacing = 500;

    $effect(() => {
      const showElectiveModules = false; // default: false
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
        let semester = parseInt(course.recommended_semester);

        if (isNaN(semester)) {
          semester = 0; // default to semester 0 if parsing fails
        }
        if (!acc[semester]) {
          acc[semester] = { courses: [], totalECTS: 0 };
        }

        // Add the course to the array
        acc[semester].courses.push(course);
        acc[semester].totalECTS += parseFloat(course.credits || 0);

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
          data: { label: `Semester ${semester}`, semesterECTS: coursesBySemester[semester].totalECTS },
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
          const coursesInSemester = coursesBySemester[semester].courses;

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

      const nodeIdToCourseMap = new Map(newNodes.map(node => [node.id, node.data.lv]));

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
              const sourceCourse = nodeIdToCourseMap.get(bestSource.nodeId);

              // Ensure we found the source course before creating the edge
              if (sourceCourse) {
                newEdges.push({
                  id: `e-${bestSource.nodeId}-${targetNode.id}`,
                  type: 'custom',
                  source: bestSource.nodeId,
                  target: targetNode.id,
                  data: { sourceCourse: sourceCourse, targetCourse: targetCourse }
                });
              }
            }
          }
        }
      }

      // calculate the maximum height needed for the separators
      const maxCoursesInSemester = Math.max(
        ...Object.values(coursesBySemester).map((semesterData) => semesterData.courses.length)
      );

      // calculate total height from the top of the first node to the bottom of the last
      const verticalSeparatorHeight = (maxCoursesInSemester - 1) * verticalSpacing + 100;

      // create the separators
      const verticalSeparatorNodes = sortedSemesters
        .slice(0, -1)
        .map((_, columnIndex) => {
          const xPosition = (columnIndex + 0.75) * horizontalSpacing;

          return {
            id: `separator-${columnIndex}`,
            type: 'verticalSeparator',
            position: { x: xPosition, y: -50 },
            draggable: false,
            selectable: false,
            connectable: false,
            style: `height: ${verticalSeparatorHeight}px; width: 0.2rem;`,
            zIndex: -1
          };
        });

      // create the horizontal separator between semesters and courses
      const horizontalSeparatorNodes = sortedSemesters.map((_, columnIndex) => {
        const xPosition = columnIndex * horizontalSpacing - (horizontalSpacing / 4);
        const yPosition = columnHeaderYPosition + 150;
        const lineWidth = horizontalSpacing / 15;

        return {
          id: `h-separator-${columnIndex}`,
          type: 'horizontalSeparator',
          position: { x: xPosition, y: yPosition },
          draggable: false,
          selectable: false,
          connectable: false,
          style: `height: 2rem; width: ${lineWidth}rem;`,
          zIndex: -1
        };
      });

      nodes = [
        ...headerNodes,
        ...newNodes,
        ...verticalSeparatorNodes,
        ...horizontalSeparatorNodes
      ];
      edges = newEdges;
    });

    function handleNodeDragStop(node: Node) {
      const draggedNode = node.targetNode;

      // only apply snapping to course nodes, not headers or separators
      if (draggedNode.type !== 'custom' || !draggedNode.position) {
        return;
      }

      // calculate the closest column index based on the node's final x position
      const closestColumnIndex = Math.round(draggedNode.position.x / horizontalSpacing);

      // calculate the exact x-coordinate for that column
      const snappedX = closestColumnIndex * horizontalSpacing;

      console.log(snappedX);

      nodes = nodes.map(node => {
        if (node.id === draggedNode.id) {
          return { ...node, position: { y: draggedNode.position.y, x: snappedX } }; // return a new node object with the updated x position
        }
        return node;
      });
    }

    // variables for graph controls
    let strokeWidth = $state(2);
    let strokeColor = $state('#000000');
</script>

<div class="graph-container">
  <div class="controls">
    <div class="stroke-control">
      <p>Stroke Width</p>
      <input type="range" min="1" max="10" bind:value={strokeWidth}/>
      <p>{strokeWidth}</p>
    </div>

    <div class="color-control">
      <p>Stroke Color</p>
      <input type="color" bind:value={strokeColor}/>
    </div>
  </div>

  <div style:height="90vh">
    <SvelteFlow
      bind:nodes
      bind:edges
      {nodeTypes}
      {edgeTypes}
      fitView
      style="--stroke-width: {strokeWidth}; --stroke-color: {strokeColor};"
      onnodedragstop={handleNodeDragStop}>
      <MiniMap />
      <Controls />
      <Background />
    </SvelteFlow>
  </div>
</div>


<style>
  .graph-container {
    margin-top: 1rem;
  }

  .controls {
    width: 20rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    right: 0;
    backdrop-filter: blur(1rem);
    border-radius: 1rem;
    z-index: 10;
  }

  .stroke-control {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 1rem
  }

  .color-control {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 1rem;
  }

  :global(.svelte-flow__edge-path) {
    stroke: var(--stroke-color);
    stroke-width: var(--stroke-width);
  }
  :global(.svelte-flow__edge.selected .svelte-flow__edge-path) {
    stroke: black;
  }
  :global(.svelte-flow__edge-label) {
    background: transparent;
    backdrop-filter: blur(1rem);
    border-radius: 0.5rem;
    border: 0.1rem solid black;
    padding: 0.5rem;
  }
</style>
