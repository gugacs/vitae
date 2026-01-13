<!--
  Code based on
  - Name: Svelte Tauri FileDrop
  - By: Kasper Henningsen
  - Licensed under: MIT License
  - Source: https://github.com/probablykasper/svelte-tauri-filedrop#usage
-->

<script lang="ts">
  import { readTextFile, exists } from "@tauri-apps/plugin-fs";
  import FileDrop from "svelte-tauri-filedrop"
  import Papa from "papaparse";
  import type { Course, Curriculum, Module } from "$lib/types/data";
  import { curriculumStore } from "$lib/states/curriculum.svelte";
  import { FileDown } from "@lucide/svelte";

  const readFile = async (path: string) => {
    try {
      // NOTE: https://v2.tauri.app/plugin/file-system
      const fileExists = await exists(path);

      if(!fileExists) {
        console.error(`File ${path} does not exist`)
        return null;
      }

      const content = await readTextFile(path);
      return content
    } catch(error) {
      console.error(error)
      return null;
    }

    return null;
  }

  const parseFile = async (content: string) => {
    // NOTE: https://www.papaparse.com/docs
    const result = Papa.parse(content, {
      delimiter: ",",	// auto-detect
      newline: "",	// auto-detect
      quoteChar: '"',
      escapeChar: '"',
      header: true,
      transformHeader: undefined,
      dynamicTyping: false,
      preview: 0,
      encoding: "",
      worker: false,
      comments: false,
      step: undefined,
      complete: undefined,
      error: undefined,
      download: false,
      downloadRequestHeaders: undefined,
      downloadRequestBody: undefined,
      skipEmptyLines: false,
      chunk: undefined,
      chunkSize: undefined,
      fastMode: undefined,
      beforeFirstChunk: undefined,
      withCredentials: undefined,
      transform: undefined,
      delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
      skipFirstNLines: 0
    });

    return result;
  }

  const parseCourse = (modules, rawCourse) => {
    const prereqString = rawCourse["prerequisites"];
    const prerequisiteIds = (prereqString && prereqString.length > 0)
      ? prereqString.split(';').map(id => id.trim())
      : [];

    const course: any = {
      id: rawCourse["course_id"],
      name: rawCourse["course_name"],
      module: [],
      subcategory: rawCourse["course_subcategory"],
      type: rawCourse["course_type"],
      credits: parseFloat(rawCourse["credits"]) || 0,
      required: parseInt(rawCourse["required"], 10),
      availability: rawCourse["availability"],
      recommended_semester: parseInt(rawCourse["recommended_semester"], 10) || 0,
      prerequisites: prerequisiteIds, // Temporarily store IDs
      frequency: rawCourse["frequency"],
      language: rawCourse["language"],
      description: rawCourse["description"],
      url: rawCourse["url"]
    };

    if (rawCourse["module_code"].includes(";")) {
      const splitCodes = rawCourse["module_code"].split(";");
      for (const code of splitCodes) {
        const foundModule = modules.find(m => m.code === code.trim());
        if (foundModule) course.module.push(foundModule);
      }
    } else {
      const foundModule = modules.find(m => m.code === rawCourse["module_code"]);
      if (foundModule)
        course.module = [foundModule];
    }

    return course as Course;
  }

  const parseToDataStructure = (data) => {
    // Storing unique modules by first iterating once over the list of courses
    let modules: Module[] = [];
    for (const row of data) {
      if (row["module_name"].includes(";")) continue;
      if (modules.find(m => m.code === row["module_code"])) continue;
      modules.push({
        code: row["module_code"],
        name: row["module_name"],
        credits: -1
      });
    }

    // Filling in all the possible data for courses
      let courses: Course[] = [];
      for (const rawCourse of data) {
        let rawCoursesToProcess = [];
        if (rawCourse["course_id"] && rawCourse["course_id"].includes(";")) {
          const splitIDs = rawCourse["course_id"].split(";");
          const splitNames = rawCourse["course_name"].split(";");
          const splitTypes = rawCourse["course_type"].split(";");
          const splitCredits = rawCourse["credits"].split(";");
          const splitRequired = rawCourse["required"] ? rawCourse["required"].split(";") : [];
          const splitAvailability = rawCourse["availability"].split(";");
          const splitRecommendedSemesters = rawCourse["recommended_semester"].split(";");
          const splitFrequencies = rawCourse["frequency"].split(";");
          const splitLanguages = rawCourse["language"].split(";");
          const splitDescriptions = rawCourse["description"].split(";");
          const splitURLs = rawCourse["url"].split(";");

          for (let j = 0; j < splitIDs.length; j++) {
            let newRawCourse = { ...rawCourse };
            newRawCourse["course_id"] = splitIDs[j].trim();
            newRawCourse["course_name"] = splitNames[j]?.trim();
            newRawCourse["course_type"] = splitTypes[j]?.trim();
            newRawCourse["credits"] = splitCredits[j]?.trim();
            newRawCourse["required"] = splitRequired[j]?.trim();
            newRawCourse["availability"] = splitAvailability[j]?.trim();
            newRawCourse["recommended_semester"] = splitRecommendedSemesters[j]?.trim();
            newRawCourse["frequency"] = splitFrequencies[j]?.trim();
            newRawCourse["language"] = splitLanguages[j]?.trim();
            newRawCourse["description"] = splitDescriptions[j]?.trim();
            newRawCourse["url"] = splitURLs[j]?.trim();
            rawCoursesToProcess.push(newRawCourse);
          }
        } else {
          rawCoursesToProcess.push(rawCourse);
        }

        for (const courseData of rawCoursesToProcess) {
          if (!courseData["course_id"]) continue; // Skip rows without an ID
          const course = parseCourse(modules, courseData);
          if (course) {
            courses.push(course);
          }
        }
      }

    // Filling in prerequisites for each course
    const coursesMap = new Map(courses.map(course => [course.id, course]));

    for (const course of courses) {
      const prerequisiteIds = course.prerequisites as unknown as string[];
      const linkedPrerequisites: Course[] = [];

      if (prerequisiteIds && prerequisiteIds.length > 0) {
        for (const prereqId of prerequisiteIds) {
          const prereqCourse = coursesMap.get(prereqId);
          if (prereqCourse) {
            linkedPrerequisites.push(prereqCourse);
          } else {
            console.warn(`Prerequisite with ID "${prereqId}" not found for course "${course.name}"`);
          }
        }
      }
      // Replace the array of IDs with the array of actual Course objects
      course.prerequisites = linkedPrerequisites;
    }

    // Creating final curriculum data structure
    let curriculum: Curriculum = {
      credits: -1,
      modules: modules,
      courses: courses
    }

    return curriculum;
  }

  const handleDrop = async (paths: string[]) => {
    if(paths.length != 1) return;
    const path = paths[0];

    // TODO: Open and read file content and return here again
    const content = await readFile(path);
    if (!content) return;
    // TODO: Parse file content to custom data structure
    const data = await parseFile(content);
    const courses = data.data;
    const parsedCurriculum = parseToDataStructure(courses)
    // TODO: Store data structure in a global svelte store
    curriculumStore.set(parsedCurriculum);
    console.log($curriculumStore);
  }
</script>

<FileDrop extensions={["csv"]} handleFiles={handleDrop} let:files>
  <div class="dropzone" class:droppable={files.length == 1}>
    <h2>Please provide us with your curriculum </h2>
    <FileDown/>
  </div>
</FileDrop>

<style>
.dropzone {
  margin: 20px;
  padding: 20px;
  background: #eee;
}
.droppable {
  background: #d6dff0;
}
</style>
