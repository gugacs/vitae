import type { Curriculum } from "$lib/types/data";
import { writable } from "svelte/store";

export const curriculumStore = writable<Curriculum>({
  credits: 0,
  modules: [],
  courses: []
});
