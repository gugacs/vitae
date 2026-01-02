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
      delimiter: "",	// auto-detect
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
    const isMultiModule = rawCourse["module_code"].includes(",");

    const course: Course = {
      id: rawCourse["course_id"],
      name: rawCourse["course_name"],
      module: [],
      subcategory: isMultiModule ? rawCourse["course_subcategory"].split(",") : rawCourse["course_subcategory"],
      type: rawCourse["course_type"],
      credits: isMultiModule ? rawCourse["credits"].split(",").map(c => parseFloat(c)) : parseFloat(rawCourse["credits"]),
      required: isMultiModule ? rawCourse["required"].split(",").map(r => parseInt(r)) : parseInt(rawCourse["required"]),
      availability: rawCourse["availability"],
      recommended_semester: isMultiModule ? rawCourse["recommended_semester"].split(",").map(s => parseInt(s)) : parseInt(rawCourse["recommended_semester"]),
      prerequisites: [],
      frequency: rawCourse["frequency"],
      language: rawCourse["language"],
      description: rawCourse["description"],
      url: rawCourse["url"]
    };

    if (isMultiModule) {
      const splitCodes = rawCourse["module_code"].split(",");
      if (splitCodes.length != rawCourse["module_name"].split(",").length) {
        console.error(`Mismatched length module codes:names of ${course.id}`);
        return null;
      }

      for (let i = 0; i < splitCodes.length; i++) {
        course.module.push(modules.find(m => m.code === splitCodes[i])!);
      }
    } else {
      course.module = [modules.find(m => m.code === rawCourse["module_code"])!];
    }

    return course;
  }

  const parseToDataStructure = (data) => {
    // Storing unique modules by first iterating once over the list of courses
    let modules: Module[] = [];

    for (let i = 0; i < data.length; i++) {
      const module: Module = {
        code: data[i]["module_code"],
        name: data[i]["module_name"],
        credits: -1
      }

      if (module.name.includes(",")) continue;
      if (modules.find(m => m.code === module.code)) continue;

      modules.push(module);
    }

    // Filling in all the possible data for courses
    let courses: Course[] = [];
    for (let i = 0; i < data.length; i++) {
      const rawCourse = data[i];
      let rawCourses = [];
      if (rawCourse["course_id"].includes(",")) {
        const splitIDs = rawCourse["course_id"].split(",");
        const splitNames = rawCourse["course_name"].split(",");
        const splitTypes = rawCourse["course_type"].split(",");
        const splitCredits = rawCourse["credits"].split(",");
        const splitRequired = rawCourse["required"].split(",");
        const splitAvailability = rawCourse["availability"].split(",");
        const splitRecommendedSemesters = rawCourse["recommended_semester"].split(",");
        const splitFrequencies = rawCourse["frequency"].split(",");
        const splitLanguages = rawCourse["language"].split(",");
        const splitDescriptions = rawCourse["description"].split(",");
        const splitURLs = rawCourse["url"].split(",");

        for (let j = 0; j < splitIDs.length; j++) {
          let newRawCourse = { ...rawCourse };
          newRawCourse["course_id"] = splitIDs[j];
          newRawCourse["course_name"] = splitNames[j];
          newRawCourse["course_type"] = splitTypes[j];
          newRawCourse["credits"] = splitCredits[j];
          newRawCourse["required"] = splitRequired[j];
          newRawCourse["availability"] = splitAvailability[j];
          newRawCourse["recommended_semester"] = splitRecommendedSemesters[j];
          newRawCourse["frequency"] = splitFrequencies[j];
          newRawCourse["language"] = splitLanguages[j];
          newRawCourse["description"] = splitDescriptions[j];
          newRawCourse["url"] = splitURLs[j];

          rawCourses.push(newRawCourse);
        }
      } else {
        rawCourses.push(rawCourse);
      }

      for (let j = 0; j < rawCourses.length; j++) {
        const course = parseCourse(modules, rawCourses[j]);
        if (!course) continue;
        courses.push(course);
      }
    }

    // Filling in prerequisites for each course
    for (let i = 0; i < data.length; i++) {
      const rawCourse = data[i];
      const prerequsites = rawCourse["prerequisites"];
      if (!prerequsites) continue;
      if (prerequsites.includes(",")) {
        const prerequisiteIDs = prerequsites.split(",");
        for (let j = 0; j < prerequisiteIDs.length; j++) {
          const prereqCourse = courses.find(c => c.id === prerequisiteIDs[j]);
          if (!prereqCourse) continue;

          courses[i].prerequisites.push(prereqCourse);
        }
      } else {
        const prereqCourse = courses.find(c => c.id === prerequsites);
        if (!prereqCourse) continue;

        courses[i].prerequisites.push(prereqCourse);
      }
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
    <h2>Drop CSV files</h2>
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
